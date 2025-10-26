import { listFiles, downloadFile } from "@huggingface/hub";
import { parquetReadObjects, asyncBufferFromUrl } from "hyparquet";

import { Db } from "./db";

const REPO_ID = "datasets/Lichess/chess-puzzles";
const REVISION = "main";

// the IDb key where the list of parquet files paths are stored
// those paths are themselves keys to retrieve the content
const LIST_PARQUET_PATHS_KEY = "parquetPaths";

async function listParquetFilePaths(): Promise<string[]> {
  const parquetFiles: string[] = [];
  console.log("Listing parquet files...");
  for await (const fileInfo of listFiles({
    repo: REPO_ID,
    revision: REVISION,
    path: "data",
  })) {
    if (fileInfo.type === "file" && fileInfo.path.endsWith(".parquet")) {
      console.log(`Found parquet file: ${fileInfo.path}`);
      parquetFiles.push(fileInfo.path);
    }
  }
  console.log(`Total parquet files found: ${parquetFiles.length}`);
  return parquetFiles;
}

export class Parquet {
  private db: Db;
  // whether download is in progress or not
  private dlWip: boolean = false;
  lastUpdated?: Date;

  constructor(db: Db) {
    this.db = db;
    const retrieved = this.db.getLocalStorage("last-updated");
    this.lastUpdated = retrieved ? new Date(retrieved) : undefined;
    if (this.lastUpdated) {
      console.log(
        `Puzzle CSV last retrieved: ${this.lastUpdated.toISOString()}`,
      );
      // DEBUG
      this.readPuzzleDb();
    }
  }

  downloadNeeded(ops: { ifAlreadyWip: boolean }): boolean {
    if (this.dlWip) return ops.ifAlreadyWip;
    if (!this.lastUpdated) return true;
    const now = new Date();
    const diff = now.getTime() - this.lastUpdated.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return diff > oneWeek;
  }

  async readPuzzleDb() {
    if (this.downloadNeeded({ ifAlreadyWip: true })) {
      throw new Error("Parquet files need to be downloaded/refreshed first.");
    }
    const fileKeys = await this.db.getIndexedDb<string[]>(
      LIST_PARQUET_PATHS_KEY,
    );
    if (!fileKeys) {
      throw new Error("No parquet file paths found in the database.");
    }
    for (const fileKey of fileKeys) {
      const file = await this.db.getIndexedDb<ArrayBuffer>(fileKey);
      if (!file) {
        throw new Error(`Parquet file not found in DB: ${fileKey}`);
      }
      // process the fileBuf as needed
      const data = await parquetReadObjects({ file });
      console.log(
        `Read ${data.length} records from ${fileKey}, ${data.slice(0, 5)}`,
      );
    }
  }

  async mreReadWorking() {
    const url =
      "https://huggingface.co/datasets/Lichess/antichess-chess-openings/resolve/main/data/train-00000-of-00001.parquet";
    const file = await asyncBufferFromUrl({ url }); // wrap url for async fetching
    const data = await parquetReadObjects({
      file,
    });
    console.log("MRE parquet read objects:", data.slice(0, 5));
  }

  async mreReadNotWorking() {
    const url =
      "https://huggingface.co/datasets/Lichess/antichess-chess-openings/resolve/main/data/train-00000-of-00001.parquet";
    const resp = await fetch(url);
    const file = await resp.arrayBuffer();
    const data = await parquetReadObjects({
      file,
    });
    console.log("MRE parquet read objects:", data.slice(0, 5));
  }

  // download the .parquet files from the dataset
  // never cached when called from here
  async download() {
    this.dlWip = true;
    const parquetPaths = await listParquetFilePaths();
    await this.db.setIndexedDb(LIST_PARQUET_PATHS_KEY, parquetPaths);
    for (const parquetPath of parquetPaths) {
      await this.downloadAndStore(parquetPath);
    }
    this.lastUpdated = new Date();
    this.db.setLocalSorage("last-updated", this.lastUpdated.toISOString());
    this.dlWip = false;
  }

  private async downloadAndStore(filePath: string) {
    console.log(`⬇️ Downloading ${filePath} ...`);
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
    await this.db.setIndexedDb(filePath, buf);
  }
}
