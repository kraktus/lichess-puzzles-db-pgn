import {
  parquetReadObjects,
  asyncBufferFromUrl,
  parquetMetadata,
} from "hyparquet";
import { compressors } from "hyparquet-compressors";

import { type MainMessage, LIST_PARQUET_PATHS_KEY, Tmp } from "../protocol";
import {
  type PgnFilerSortExportOptions,
  filterPuzzle,
  puzzleToPGN,
  type PuzzleRecord,
  puzzleRecordToStr,
  type SortBy,
} from "../pgn";
import { sortingIncludingBigInt } from "../util";
import { Db, type Store } from "../db";

const COLUMNS = ["PuzzleId", "FEN", "Moves", "Rating", "Popularity", "Themes"];

interface State {
  store: Store;
  tmp: Tmp;
}
let statePromise = Db.open({ deleteTmp: false }).then((db) => {
  return {
    store: db.stores.parquet,
    tmp: new Tmp(db.stores.tmp),
  };
});

const update = (msg: string) => {
  self.postMessage({
    tpe: "status",
    status: msg,
  });
};

const log = (msg: string) => {
  self.postMessage({
    tpe: "log",
    log: msg,
  });
};

class PuzzlesSorted<T extends PuzzleRecord[] | Map<number, PuzzleRecord[]>> {
  private inner: T;
  private sortBy?: SortBy;

  private constructor(inner: T, sortBy?: SortBy) {
    this.inner = inner;
    this.sortBy = sortBy;
  }

  push(puzzle: PuzzleRecord) {
    if (this.inner instanceof Map && this.sortBy) {
      const key =
        this.sortBy === "rating"
          ? Number(puzzle.Rating)
          : Number(puzzle.Popularity);
      if (!this.inner.has(key)) {
        this.inner.set(key, []);
      }
      this.inner.get(key)!.push(puzzle);
    } else {
      (this.inner as PuzzleRecord[]).push(puzzle);
    }
  }

  listSorted(): PuzzleRecord[] {
    if (this.inner instanceof Map && this.sortBy) {
      update(`Sorting puzzles by ${this.sortBy}...`);
      const sortedKeys = Array.from(this.inner.keys()).sort((a, b) => b - a);
      const result: PuzzleRecord[] = [];
      for (const key of sortedKeys) {
        const puzzles = this.inner.get(key)!;
        result.push(...puzzles);
      }
      return result;
    } else {
      return this.inner as PuzzleRecord[];
    }
  }

  static make(sortBy?: SortBy) {
    if (sortBy) {
      return new PuzzlesSorted<Map<number, PuzzleRecord[]>>(new Map(), sortBy);
    } else {
      return new PuzzlesSorted<PuzzleRecord[]>([], sortBy);
    }
  }
}

async function readFilterSortPuzzleDb(
  opts: PgnFilerSortExportOptions,
  rowReadChunkSize: number,
): Promise<PuzzleRecord[]> {
  const state = await statePromise;
  const fileKeys = await state.store.get<string[]>(LIST_PARQUET_PATHS_KEY);
  if (!fileKeys) {
    throw new Error("No parquet file paths found in the database.");
  }
  let results = PuzzlesSorted.make(opts.sortBy);
  for (const [i, fileKey] of fileKeys.entries()) {
    log(`Retrieving parquet file ${fileKey}`);
    const file = await state.store.get<ArrayBuffer>(fileKey);
    if (!file) {
      throw new Error(`Parquet file not found in DB: ${fileKey}`);
    }
    log(`Retrieved ${fileKey}`);
    const metadata = parquetMetadata(file);
    const numRows = Number(metadata.num_rows);
    log(`Retrieved metadata for ${fileKey}, numRows: ${numRows}`);
    for (let rowStart = 0; rowStart < numRows; rowStart += rowReadChunkSize) {
      const rowEnd = Math.min(rowStart + rowReadChunkSize, numRows);
      update(
        `Reading parquet file ${i + 1} of ${fileKeys.length}, rows ${rowStart}/${numRows}...`,
      );
      const data = await parquetReadObjects({
        file,
        columns: COLUMNS,
        rowStart,
        rowEnd,
        compressors,
      });
      log(
        `Filtering parquet file ${fileKey}, rows ${rowStart} to ${rowEnd}...`,
      );
      // not sure if that's faster than loop filter push, shouldn't matter
      (data as PuzzleRecord[]).forEach((puzzle) => {
        if (filterPuzzle(puzzle, opts)) {
          results.push(puzzle);
        }
      });
    }
  }
  let puzzles = results.listSorted();
  console.log(`Total puzzles after filtering: ${puzzles.length}`);
  if (opts.maxPuzzles !== undefined) {
    update(`Only keeping firsts ${opts.maxPuzzles} `);
    puzzles = puzzles.slice(0, opts.maxPuzzles);
  }
  return puzzles;
}

async function toPgn(
  opts: PgnFilerSortExportOptions,
  rowReadChunkSize: number,
  nbPuzzles: number,
): Promise<void> {
  const state = await statePromise;
  let chunkNo = 0;
  for await (const puzzlesChunk of state.tmp.iteratePuzzleRecordsChunks()) {
    update(
      `Exporting puzzles to PGN... (${chunkNo * rowReadChunkSize}/${nbPuzzles})`,
    );
    const pgnChunk = puzzlesChunk
      .map((puzzle) => puzzleToPGN(puzzle, opts))
      .join("\n\n");
    await state.tmp.setPgnChunk(chunkNo, pgnChunk);
    chunkNo++;
  }
}

self.onmessage = async (event: MessageEvent<MainMessage>) => {
  const msg = event.data;
  switch (msg.tpe) {
    case "sendWork":
      const rowReadChunkSize = msg.work.rowReadChunkSize;
      let puzzles: PuzzleRecord[] | undefined = await readFilterSortPuzzleDb(
        msg.work.opts,
        rowReadChunkSize,
      );
      const nbPuzzles = puzzles.length;
      const state = await statePromise;
      for (let i = 0; i < puzzles.length / rowReadChunkSize; i++) {
        const start = i * rowReadChunkSize;
        const end = Math.min(start + rowReadChunkSize, puzzles.length);
        log(`Dumping puzzle records chunk ${i} (${start}/${nbPuzzles})...`);
        state.tmp.setPuzzleRecordChunk(i, puzzles.slice(start, end));
      }
      puzzles = undefined; // make sure to free memory
      await toPgn(msg.work.opts, rowReadChunkSize, nbPuzzles);
      self.postMessage({ tpe: "workDone" });
      break;
  }
};
