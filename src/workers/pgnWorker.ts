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

async function toPgn(
  opts: PgnFilerSortExportOptions,
  recordToPGNChunkSize: number,
  nbPuzzles: number,
): Promise<void> {
  const state = await statePromise;
  let chunkNo = 0;
  for await (const puzzlesChunk of state.tmp.iteratePuzzleRecordsChunks()) {
    update(
      `Exporting puzzles to PGN... (${chunkNo * recordToPGNChunkSize}/${nbPuzzles})`,
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
    case "sendPgn":
      const recordToPGNChunkSize = msg.work.recordToPGNChunkSize;
      const nbPuzzles = msg.work.nbPuzzles;
      await toPgn(msg.work.opts, recordToPGNChunkSize, nbPuzzles);
      self.postMessage({ tpe: "pgnDone" });
      break;
  }
};
