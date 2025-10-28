import { listFiles, downloadFile } from "@huggingface/hub";
import { parquetReadObjects, asyncBufferFromUrl } from "hyparquet";
import { compressors } from "hyparquet-compressors";

import { Db } from "./db";
import { PgnFilerSortExportOptions, filterPuzzle, puzzleToPGN } from "./pgn";
import { Status } from "./view";
import { sortingIncludingBigInt } from "./util";

const REPO_ID = "datasets/Lichess/chess-puzzles";
const REVISION = "main";

// the IDb key where the list of parquet files paths are stored
// those paths are themselves keys to retrieve the content
const LIST_PARQUET_PATHS_KEY = "parquetPaths";

const COLUMNS = ["PuzzleId", "FEN", "Moves", "Rating", "Popularity", "Themes"];

export type PuzzleRecord = {
  PuzzleId: string;
  FEN: string;
  Moves: string;
  Rating: number;
  Popularity: number;
  Themes: string[];
};

// FEN is not the start of the position, see `puzzleToPGN`, moves are in the PGN already
export const puzzleRecordToStr = (p: PuzzleRecord): string[] => {
  return [
    `PuzzleId: ${p.PuzzleId}`,
    `Rainting: ${p.Rating}`,
    `Popularity: ${p.Popularity}`,
    `Themes: ${p.Themes.join(", ")}`,
  ];
};

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
  // whether download is in progress or not
  private dl: Dl;
  private lastUpdated?: Date;
  private status: Status;

  constructor(db: Db, status: Status) {
    this.db = db;
    const retrieved = this.db.getLocalStorage("last-updated");
    this.lastUpdated = retrieved ? new Date(retrieved) : undefined;
    if (this.lastUpdated) {
      console.log(
        `Puzzle CSV last retrieved: ${this.lastUpdated.toISOString()}`,
      );
    }
    this.dl = new Dl();
    this.status = status;
  }

  downloadNeeded(ops: { ifAlreadyWip: boolean }): boolean {
    if (this.dl.inProgress()) return ops.ifAlreadyWip;
    if (!this.lastUpdated) return true;
    const now = new Date();
    const diff = now.getTime() - this.lastUpdated.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return diff > oneWeek;
  }

  async readFilterSortPuzzleDb(
    opts: PgnFilerSortExportOptions,
  ): Promise<PuzzleRecord[]> {
    if (this.downloadNeeded({ ifAlreadyWip: true })) {
      throw new Error("Parquet files need to be downloaded/refreshed first.");
    }
    const fileKeys = await this.db.getIndexedDb<string[]>(
      LIST_PARQUET_PATHS_KEY,
    );
    if (!fileKeys) {
      throw new Error("No parquet file paths found in the database.");
    }
    let results: PuzzleRecord[] = [];
    for (const [i, fileKey] of fileKeys.entries()) {
      console.log(`Retrieving parquet file ${fileKey}`);
      const file = await this.db.getIndexedDb<ArrayBuffer>(fileKey);
      if (!file) {
        throw new Error(`Parquet file not found in DB: ${fileKey}`);
      }
      console.log(`Retrieved parquet file ${fileKey}`);
      this.status.update(
        `Reading parquet file ${i + 1} of ${fileKeys.length}...`,
      );
      console.log(`Reading parquet file ${fileKey}`);
      const data = await parquetReadObjects({
        file,
        columns: COLUMNS,
        compressors,
      });
      console.log(`Filterring parquet file ${fileKey}`);
      // not sure if that's faster than loop filter push, shouldn't matter
      results = results.concat(
        (data as PuzzleRecord[]).filter((p) => filterPuzzle(p, opts)),
      );
    }
    console.log(`All parquet file read, sorting...`);
    if (opts.sortBy == "rating") {
      this.status.update(`Sorting by rating`);
      results.sort((a, b) => sortingIncludingBigInt(a.Rating, b.Rating));
    } else if (opts.sortBy == "popularity") {
      this.status.update(`Sorting by popularity`);
      results.sort((a, b) =>
        sortingIncludingBigInt(b.Popularity, a.Popularity),
      );
    }

    if (opts.maxPuzzles !== undefined) {
      this.status.update(`Only keeping firsts ${opts.maxPuzzles} `);
      results = results.slice(0, opts.maxPuzzles);
    }
    return results;
  }

  // return the PGN as string
  async pgnPipeline(opts: PgnFilerSortExportOptions): Promise<string> {
    // we only want to restart a download if not alreay wip
    if (this.downloadNeeded({ ifAlreadyWip: false })) {
      await this.download();
    }
    this.status.update("Downloading the puzzle database...");
    await this.dl.resolveWHenFinished();
    const puzzleRecords = await this.readFilterSortPuzzleDb(opts);

    this.status.update(`Exporting ${puzzleRecords.length} puzzles to PGN...`);
    return puzzleRecords.map((p) => puzzleToPGN(p, opts)).join("\n\n");
  }

  // download the .parquet files from the dataset
  // never cached when called from here
  async download() {
    this.dl.start(
      new Promise(async (dlFinished) => {
        const parquetPaths = await listParquetFilePaths();
        await this.db.setIndexedDb(LIST_PARQUET_PATHS_KEY, parquetPaths);
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
    console.log(`Downloading ${filePath} ...`);
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
