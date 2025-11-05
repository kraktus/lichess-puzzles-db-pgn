// define types used by the main-thread and the worker

import { Store, type IDbValue } from "./db";

import { type PgnFilerSortExportOptions, type PuzzleRecord } from "./pgn";

// the IDb key where the list of parquet files paths are stored
// those paths are themselves keys to retrieve the content
export const LIST_PARQUET_PATHS_KEY = "parquetPaths";

const PGN_EXPORT_KEY = (chunkNo: number) => `pgnExport-${chunkNo}`;
const PUZZLE_RECORD_CACHE = (chunkNo: number) => `puzzleRecordCache-${chunkNo}`;

export class Tmp {
  constructor(private readonly inner: Store) {}

  private async *iterate<T extends IDbValue>(
    prefix: (no: number) => string,
  ): AsyncGenerator<T, void, unknown> {
    let chunkNo = 0;
    while (true) {
      const pgnChunk = await this.inner.get<T>(prefix(chunkNo));
      if (!pgnChunk) {
        break;
      }
      yield pgnChunk;
      chunkNo += 1;
    }
  }

  iteratePgnChunks(): AsyncGenerator<string, void, unknown> {
    return this.iterate<string>(PGN_EXPORT_KEY);
  }

  // used to minimise RAM usage when doing `PuzzleRecord` => PGN
  iteratePuzzleRecordsChunks(): AsyncGenerator<PuzzleRecord[], void, unknown> {
    return this.iterate<PuzzleRecord[]>(PUZZLE_RECORD_CACHE);
  }

  async setPgnChunk(no: number, pgnChunk: string): Promise<void> {
    return await this.inner.put(PGN_EXPORT_KEY(no), pgnChunk);
  }
  async setPuzzleRecordChunk(
    no: number,
    puzzleRecords: PuzzleRecord[],
  ): Promise<void> {
    return await this.inner.put(PUZZLE_RECORD_CACHE(no), puzzleRecords);
  }
}

export interface SendParquet {
  opts: PgnFilerSortExportOptions;
  rowReadChunkSize: number;
  recordToPGNChunkSize: number;
}
export interface SendPgn {
  opts: PgnFilerSortExportOptions;
  nbPuzzles: number;
  recordToPGNChunkSize: number;
}

// from mainThread -> Worker
export type MainMessage =
  | {
      tpe: "sendParquet";
      work: SendParquet;
    }
  | {
      tpe: "sendPgn";
      work: SendPgn;
    };

// from Worker -> mainThread
export type WorkerMessge =
  | { tpe: "status"; status: string }
  | { tpe: "log"; log: string }
  | { tpe: "parquetDone"; nbPuzzles: number }
  | { tpe: "pgnDone" }
  | { tpe: "error"; error: string };
