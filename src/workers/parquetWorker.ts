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
      const totalLen = Array.from(this.inner.values()).reduce(
        (acc, arr) => acc + arr.length,
        0,
      );
      const sortedKeys = Array.from(this.inner.keys()).sort((a, b) => b - a);
      // fixed length array at first to avoid reallocating, and reduce memory pressure
      let result: PuzzleRecord[] = Array(totalLen);
      let i = 0;
      for (const key of sortedKeys) {
        const puzzles = this.inner.get(key)!;
        for (const puzzle of puzzles) {
          result[i] = puzzle;
          i++;
        }
      }
      console.assert(i === totalLen, "Total length mismatch in sorted puzzles");
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
  const puzzles = results.listSorted();
  if (opts.maxPuzzles !== undefined) {
    update(`Only keeping firsts ${opts.maxPuzzles} `);
    puzzles.length = Math.min(puzzles.length, opts.maxPuzzles);
  }
  return puzzles;
}

self.onmessage = async (event: MessageEvent<MainMessage>) => {
  const msg = event.data;
  switch (msg.tpe) {
    case "sendParquet":
      const recordToPGNChunkSize = msg.work.recordToPGNChunkSize;
      let puzzles: PuzzleRecord[] | undefined = await readFilterSortPuzzleDb(
        msg.work.opts,
        msg.work.rowReadChunkSize,
      );
      const nbPuzzles = puzzles.length;
      const state = await statePromise;
      for (let i = 0; i < puzzles.length / recordToPGNChunkSize; i++) {
        const start = i * recordToPGNChunkSize;
        const end = Math.min(start + recordToPGNChunkSize, puzzles.length);
        update(`Prepating for PGN export (${start}/${nbPuzzles})...`);
        const slice = puzzles.slice(start, end);
        state.tmp.setPuzzleRecordChunk(i, slice);
      }
      self.postMessage({ tpe: "parquetDone", nbPuzzles });
      break;
  }
};
