import {
  parquetReadObjects,
  asyncBufferFromUrl,
  parquetMetadata,
} from "hyparquet";
import { compressors } from "hyparquet-compressors";

import {
  type InitState,
  type MainMessage,
  LIST_PARQUET_PATHS_KEY,
} from "../protocol";
import {
  type PgnFilerSortExportOptions,
  filterPuzzle,
  puzzleToPGN,
  type PuzzleRecord,
  puzzleRecordToStr,
} from "../pgn";
import { sortingIncludingBigInt } from "../util";

const COLUMNS = ["PuzzleId", "FEN", "Moves", "Rating", "Popularity", "Themes"];

let state: InitState;

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

async function readFilterSortPuzzleDb(
  opts: PgnFilerSortExportOptions,
): Promise<PuzzleRecord[]> {
  if (!state) {
    throw new Error("Sent work before initialization");
  }
  const fileKeys = await state.store.get<string[]>(LIST_PARQUET_PATHS_KEY);
  if (!fileKeys) {
    throw new Error("No parquet file paths found in the database.");
  }
  let results: PuzzleRecord[] = [];
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
    for (
      let rowStart = 0;
      rowStart < numRows;
      rowStart += state.rowReadChunkSize
    ) {
      const rowEnd = Math.min(rowStart + state.rowReadChunkSize, numRows);
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
      results = results.concat(
        (data as PuzzleRecord[]).filter((p) => filterPuzzle(p, opts)),
      );
    }
  }
  log(`All parquet file read, sorting...`);
  if (opts.sortBy == "rating") {
    update(`Sorting by rating`);
    results.sort((a, b) => sortingIncludingBigInt(a.Rating, b.Rating));
  } else if (opts.sortBy == "popularity") {
    update(`Sorting by popularity`);
    results.sort((a, b) => sortingIncludingBigInt(b.Popularity, a.Popularity));
  }

  if (opts.maxPuzzles !== undefined) {
    update(`Only keeping firsts ${opts.maxPuzzles} `);
    results = results.slice(0, opts.maxPuzzles);
  }
  return results;
}

function toPgn(
  puzzles: PuzzleRecord[],
  opts: PgnFilerSortExportOptions,
): string {
  update(`Exporting ${puzzles.length} puzzles to PGN...`);
  return puzzles.map((p) => puzzleToPGN(p, opts)).join("\n\n");
}

self.onmessage = async (event: MessageEvent<MainMessage>) => {
  const msg = event.data;
  switch (msg.tpe) {
    case "init":
      state = msg.state;
      break;
  }
};
