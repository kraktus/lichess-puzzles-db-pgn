const prefix = "lipuzzles-csv";
const objectStore = "db";

export class Db {
  private inner: IDBDatabase;

  constructor(inner: IDBDatabase) {
    this.inner = inner;
  }

  static async openDb(): Promise<Db> {
    const openReq = indexedDB.open(prefix, 1);
    return new Promise<Db>((resolve) => {
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
        resolve(new Db(db));
      };
    });
  }

  private async getIndexedDb(key: string): Promise<string | null> {
    const tx = this.inner.transaction(objectStore, "readonly");
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
    console.log(`Getting from localStorage: ${key}`);
    return window.localStorage.getItem(`${prefix}-${key}`);
  }

  private async setIndexedDb(key: string, value: string): Promise<void> {
    const tx = this.inner.transaction(objectStore, "readwrite");
    const store = tx.objectStore(objectStore);
    const req = store.put({ id: key, data: value });
    return new Promise<void>((resolve, reject) => {
      req.onsuccess = () => {
        console.log(`IndexedDB set successful: ${key}`);
        resolve();
      };
      req.onerror = (event: any) =>
        reject(new Error(`Failed to set IndexedDB item: ${event}`));
    });
  }

  private setLocalSorage(key: string, value: string) {
    console.log(`Setting to localStorage: ${key}, ${value}`);
    window.localStorage.setItem(`${prefix}-${key}`, value);
  }
}
