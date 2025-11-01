// define types used by the main-thread and the worker

import { Store } from "./db";

import { type PgnFilerSortExportOptions } from "./pgn";

// the IDb key where the list of parquet files paths are stored
// those paths are themselves keys to retrieve the content
export const LIST_PARQUET_PATHS_KEY = "parquetPaths";

export const PGN_EXPORT_KEY = "pgnExport";

export interface InitState {
  store: Store;
  rowReadChunkSize: number;
}

export interface SendWork {
  parquetStoreKey: string;
  opts: PgnFilerSortExportOptions;
}

// from mainThread -> Worker
export type MainMessage =
  | {
      tpe: "init";
      state: InitState;
    }
  | {
      tpe: "sendWork";
      work: SendWork;
    };

// from Worker -> mainThread
type WorkerMessge =
  | { tpe: "status"; status: string }
  | { tpe: "log"; log: string }
  | { tpe: "jobDone" } // result is saved in the IDB
  | { tpe: "error"; error: string };
