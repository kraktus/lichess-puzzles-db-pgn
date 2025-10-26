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

class Parquet {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  // download the .parquet files from the dataset
  // never cached when called from here
  async download() {
    const parquetPaths = await listParquetFilePaths();
    await this.db.setIndexedDb(LIST_PARQUET_PATHS_KEY, parquetPaths);
    for (const parquetPath of parquetPaths) {
      await this.downloadAndStore(parquetPath);
    }
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
