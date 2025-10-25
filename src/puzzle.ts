const prefix = "lipuzzles-csv";
const objectStore = "db";

export class PuzzleCsv {
  lastUpdated?: Date;
  private db: Promise<IDBDatabase>;

  constructor() {
    const retrieved = this.getItem("last-updated");
    this.lastUpdated = retrieved ? new Date(retrieved) : undefined;
    this.db = this.openDb();
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

  csvIsRecent() {
    if (!this.lastUpdated) return false;
    const now = new Date();
    const diff = now.getTime() - this.lastUpdated.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return diff < oneWeek;
  }

  async download() {
    const licsv = await fetch(
      "https://database.lichess.org/lichess_db_puzzle.csv.zst",
    );
    if (!licsv.ok) {
      throw new Error(
        `Failed to download lichess puzzles CSV: ${licsv.status} ${licsv.statusText}`,
      );
    }
    const zstded = await licsv.blob();
    //this.setItem("data-zstd", zstded);
    this.lastUpdated = new Date();
    this.setItem("last-updated", this.lastUpdated.toISOString());
  }

  private getItem(key: string): string | null {
    return window.localStorage.getItem(`${prefix}-${key}`);
  }
  private setItem(key: string, value: string) {
    window.localStorage.setItem(`${prefix}-${key}`, value);
  }
}
