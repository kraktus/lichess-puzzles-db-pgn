import { listFiles, downloadFile } from "@huggingface/hub";
import { Db, Store } from "./db";
import { type PgnFilerSortExportOptions } from "./pgn";
import { Status } from "./view";
import { sortingIncludingBigInt } from "./util";
import { log } from "./log";
import {
  LIST_PARQUET_PATHS_KEY,
  PGN_EXPORT_KEY,
  type WorkerMessge,
} from "./protocol";
import ParquetWorker from "./workers/parquetWorker?worker";

const REPO_ID = "datasets/Lichess/chess-puzzles";
const REVISION = "main";

const COLUMNS = ["PuzzleId", "FEN", "Moves", "Rating", "Popularity", "Themes"];

async function listParquetFilePaths(): Promise<string[]> {
  const parquetFiles: string[] = [];
  log.log("Listing parquet files...");
  for await (const fileInfo of listFiles({
    repo: REPO_ID,
    revision: REVISION,
    path: "data",
  })) {
    if (fileInfo.type === "file" && fileInfo.path.endsWith(".parquet")) {
      log.log(`Found parquet path in files: ${fileInfo.path}`);
      parquetFiles.push(fileInfo.path);
    }
  }
  log.log(`Total parquet files found: ${parquetFiles.length}`);
  return parquetFiles;
}

// Download wip status
class Dl {
  // when download is NOT in progress, `undefined`
  // otherwise it's a `Promise` that resolve when it's finished
  private whenFinished: Promise<void> | undefined;

  constructor() {
    this.whenFinished = undefined;
  }

  inProgress(): boolean {
    return this.whenFinished !== undefined;
  }

  start(dlPromise: Promise<void>) {
    this.whenFinished = dlPromise;
  }

  async resolveWHenFinished(): Promise<void> {
    if (!this.whenFinished) {
      return Promise.resolve();
    }
    return this.whenFinished.then(() => {
      this.whenFinished = undefined;
    });
  }
}

export class Parquet {
  private db: Db;
  private store: Store;
  // whether download is in progress or not
  private dl: Dl;
  private lastUpdated?: Date;
  private status: Status;
  rowReadChunkSize: number;

  constructor(db: Db, status: Status, rowReadChunkSize: number) {
    this.db = db;
    this.store = db.stores.parquet;
    const retrieved = this.db.getLocalStorage("last-updated");
    this.lastUpdated = retrieved ? new Date(retrieved) : undefined;
    if (this.lastUpdated) {
      log.log(`Puzzle CSV last retrieved: ${this.lastUpdated.toISOString()}`);
    }
    this.dl = new Dl();
    this.status = status;
    this.rowReadChunkSize = rowReadChunkSize;
  }

  downloadNeeded(ops: { ifAlreadyWip: boolean }): boolean {
    if (this.dl.inProgress()) return ops.ifAlreadyWip;
    if (!this.lastUpdated) return true;
    const now = new Date();
    const diff = now.getTime() - this.lastUpdated.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return diff > oneWeek;
  }

  async doExportViaWorker(opts: PgnFilerSortExportOptions): Promise<string> {
    if (this.downloadNeeded({ ifAlreadyWip: true })) {
      throw new Error("Parquet files need to be downloaded/refreshed first.");
    }
    const worker = new ParquetWorker();
    worker.postMessage({
      tpe: "sendWork",
      work: {
        opts: opts,
        rowReadChunkSize: this.rowReadChunkSize,
      },
    });
    await new Promise<void>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<WorkerMessge>) => {
        switch (event.data.tpe) {
          case "status":
            this.status.update(event.data.status);
            break;
          case "log":
            log.log(`Worker: ${event.data.log}`);
            break;
          case "workDone":
            this.status.update("Export work done.");
            resolve();
            break;
          case "error":
            this.status.update(`Error: ${event.data.error}`);
            reject(new Error(event.data.error));
            break;
        }
      };
    });
    const pgn = await this.store.get<string>(PGN_EXPORT_KEY);
    if (pgn) {
      return pgn;
    } else {
      throw new Error("No PGN export found in the database.");
    }
  }

  // return the PGN as string
  async pgnPipeline(opts: PgnFilerSortExportOptions): Promise<string> {
    log.log(`Starting PGN export pipeline, ops ${JSON.stringify(opts)}`);
    // we only want to restart a download if not alreay wip
    if (this.downloadNeeded({ ifAlreadyWip: false })) {
      await this.download();
    }
    this.status.update("Downloading the puzzle database...");
    await this.dl.resolveWHenFinished();
    return await this.doExportViaWorker(opts);
  }

  // download the .parquet files from the dataset
  // never cached when called from here
  async download() {
    this.dl.start(
      new Promise(async (dlFinished) => {
        const parquetPaths = await listParquetFilePaths();
        await this.store.put(LIST_PARQUET_PATHS_KEY, parquetPaths);
        for (const parquetPath of parquetPaths) {
          await this.downloadAndStore(parquetPath);
        }
        this.lastUpdated = new Date();
        this.db.setLocalSorage("last-updated", this.lastUpdated.toISOString());
        dlFinished();
      }),
    );
  }

  private async downloadAndStore(filePath: string) {
    log.log(`Downloading ${filePath} ...`);
    const file = await downloadFile({
      repo: REPO_ID,
      path: filePath,
      revision: REVISION,
      // experimental, live on the edge, aims high fail low, break stuff...
      // not supported natively by safari
      // xet: true,
    });
    if (!file) {
      throw new Error(`Failed to download file: ${filePath}`);
    }
    const buf = await file.arrayBuffer();
    await this.store.put(filePath, buf);
  }
}
