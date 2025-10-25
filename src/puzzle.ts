const prefix = "lipuzzles-csv";

export class PuzzleCsv {
  lastUpdated?: Date;
  //private db: IndexedDBDatabase;

  constructor() {
    const retrieved = this.getItem("last-updated");
    this.lastUpdated = retrieved ? new Date(retrieved) : undefined;
    //this.db = new IndexedDBDatabase(prefix);
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
