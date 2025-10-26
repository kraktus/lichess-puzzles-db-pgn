import { Db } from "./db";
import { listFiles, downloadFile } from "@huggingface/hub";

const REPO_ID = "Lichess/chess-puzzles";
const REVISION = "main";

// the IDb key where the list of parquet files paths are stored
// those paths are themselves keys to retrieve the content
const LIST_PARQUET_PATHS_KEY = "parquetPaths";

async function listParquetFilePaths(): Promise<string[]> {
  const parquetFiles: string[] = [];
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
    }
  }

  downloadNeeded() {
    if (this.dlWip) return false;
    if (!this.lastUpdated) return true;
    const now = new Date();
    const diff = now.getTime() - this.lastUpdated.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return diff > oneWeek;
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
      xet: true,
    });
    if (!file) {
      throw new Error(`Failed to download file: ${filePath}`);
    }
    const buf = await file.arrayBuffer();
    await this.db.setIndexedDb(filePath, buf);
  }
}
