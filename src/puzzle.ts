import { init, decompress } from "@bokuweb/zstd-wasm";
import { Buffer } from "buffer";

import { toBase64, toBlob } from "./util";

const prefix = "lipuzzles-csv";
const objectStore = "db";

export class PuzzleCsv {
  lastUpdated?: Date;
  // whether download is in progress or not
  private dlWip: boolean = false;
  private db: Promise<IDBDatabase>;

  constructor() {
    init();
    const retrieved = this.getLocalStorage("last-updated");
    this.lastUpdated = retrieved ? new Date(retrieved) : undefined;
    if (this.lastUpdated) {
      console.log(
        `Puzzle CSV last retrieved: ${this.lastUpdated.toISOString()}`,
      );
    }
    this.db = this.openDb();
    // DEBUG
    this.db.then(() => this.decompressCsv());
  }

  openDb() {
    const openReq = indexedDB.open(prefix, 1);
    return new Promise<IDBDatabase>((resolve) => {
      openReq.onupgradeneeded = () => {
        let db = openReq.result;
        if (!db.objectStoreNames.contains(objectStore)) {
          db.createObjectStore(objectStore, { keyPath: "id" });
        }
      };
      openReq.onerror = (event: any) =>
        console.error(`DB open error: ${event}`);
      openReq.onblocked = function () {
        // this event shouldn't trigger if we handle onversionchange correctly
        const blocked =
          "Database is blocked, close all other tabs of this page";
        console.error(blocked);
        alert(blocked);
      };
      openReq.onsuccess = function () {
        console.log("IndexedDB opened successfully");
        let db = openReq.result;

        db.onversionchange = function () {
          db.close();
          const outdated = "Database is outdated, please reload the page.";
          console.error(outdated);
          alert(outdated);
        };
        resolve(db);
      };
    });
  }

  downloadNeeded() {
    if (this.dlWip) return false;
    if (!this.lastUpdated) return true;
    const now = new Date();
    const diff = now.getTime() - this.lastUpdated.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return diff > oneWeek;
  }

  async download() {
    console.log("starting download of lichess puzzles CSV");
    const licsv = await fetch(
      // CORS issue
      //"https://database.lichess.org/lichess_db_puzzle.csv.zst",
      "https://raw.githubusercontent.com/kraktus/lichess-puzzles-db-pgn-data/refs/heads/master/lichess_db_puzzle-light.csv.zst",
    );
    if (!licsv.ok) {
      throw new Error(
        `Failed to download lichess puzzles CSV: ${licsv.status} ${licsv.statusText}`,
      );
    }
    console.log("downloaded lichess puzzles CSV");
    const zstded = await licsv.blob();
    console.log("converting zstded CSV to Base64");
    const zstdBase64 = await toBase64(zstded);
    console.log("converted zstded CSV to Base64");
    console.log("storing zstded CSV to IndexedDB");
    await this.setIndexedDb("zstded", zstdBase64);
    console.log("stored zstded CSV to IndexedDB");
    this.lastUpdated = new Date();
    this.setLocalSorage("last-updated", this.lastUpdated.toISOString());
  }

  async decompressCsv(): Promise<string> {
    console.log("retrieving zstded CSV from IndexedDB");
    const zstedBase64 = await this.getIndexedDb("zstded");
    if (!zstedBase64) throw new Error("No zstded CSV found in IndexedDB");
    console.log("retrieved zstded CSV from IndexedDB");
    console.log("converting back zstded CSV to Blob");
    const zstedBlob = await toBlob(zstedBase64);
    console.log("converted back zstded CSV to Blob");
    const zstedArrayBuffer = await zstedBlob.arrayBuffer();
    const zstdedBuffer = Buffer.from(zstedArrayBuffer);
    console.log("decompressing CSV");
    const res = decompress(zstdedBuffer);
    const resStr = Buffer.from(res).toString();
    console.log("decompressed CSV", resStr.slice(0, 200) + "...");
    return resStr;
  }

  private async getIndexedDb(key: string): Promise<string | null> {
    const db = await this.db;
    const tx = db.transaction(objectStore, "readonly");
    const store = tx.objectStore(objectStore);
    const req = store.get(key);
    return new Promise<string | null>((resolve, reject) => {
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = (event: any) =>
        reject(new Error(`Failed to get IndexedDB item: ${event}`));
    });
  }

  private getLocalStorage(key: string): string | null {
    return window.localStorage.getItem(`${prefix}-${key}`);
  }

  private async setIndexedDb(key: string, value: string): Promise<void> {
    const db = await this.db;
    const tx = db.transaction(objectStore, "readwrite");
    const store = tx.objectStore(objectStore);
    const req = store.put({ id: key, data: value });
    return new Promise<void>((resolve, reject) => {
      req.onsuccess = () => resolve();
      req.onerror = (event: any) =>
        reject(new Error(`Failed to set IndexedDB item: ${event}`));
    });
  }

  private setLocalSorage(key: string, value: string) {
    window.localStorage.setItem(`${prefix}-${key}`, value);
  }
}
