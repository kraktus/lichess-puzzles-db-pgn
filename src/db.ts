const prefix = "lipuzzles-csv";
//const objectStore = "db";

// TODO, switch to `idb` package?
type IDbValue = Blob | string | ArrayBuffer | Uint8Array | string[];

const storeKeys = ["log", "parquet"] as const;
type StoreKeys = (typeof storeKeys)[number];

export class Db {
  private inner: IDBDatabase;
  private stores: Record<StoreKeys, Store>;

  constructor(inner: IDBDatabase, stores: Record<StoreKeys, Store>) {
    this.inner = inner;
    this.stores = stores;
  }

  static async open(): Promise<Db> {
    const openReq = indexedDB.open(prefix, 1);
    return new Promise<Db>((resolve) => {
      openReq.onupgradeneeded = () => {
        let db = openReq.result;
        // create all stores
        for (const storeKey of storeKeys) {
          if (!db.objectStoreNames.contains(storeKey)) {
            db.createObjectStore(storeKey, { keyPath: "id" });
          }
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
        const stores = {
          log: new Store(db, "log"),
          parquet: new Store(db, "parquet"),
        };
        resolve(new Db(db, stores));
      };
    });
  }

  // delete the current Db (IDB + Localstorage)
  async clearDb(): Promise<void> {
    const closeDb = this.inner;
    closeDb.close();
    const deleteReq = indexedDB.deleteDatabase(prefix);
    localStorage.clear();
    return new Promise<void>((resolve, reject) => {
      deleteReq.onsuccess = () => {
        console.log("IndexedDB deleted successfully");
        resolve();
      };
      deleteReq.onerror = (event: any) =>
        reject(new Error(`Failed to delete IndexedDB: ${event}`));
      deleteReq.onblocked = () => {
        const blocked =
          "Database deletion is blocked, close all other tabs of this page";
        console.error(blocked);
        alert(blocked);
      };
    });
  }

  async getIndexedDb<T extends IDbValue>(key: string): Promise<T | null> {
    // DEBUG
    return Promise.resolve(null);
  }

  getLocalStorage(key: string): string | null {
    console.log(`Getting from localStorage: ${key}`);
    return window.localStorage.getItem(`${prefix}-${key}`);
  }

  // ArrayBuffer, Blob, File, and typed arrays like Uint8Array
  async setIndexedDb(key: string, value: IDbValue): Promise<void> {
    // DEBUG
    return Promise.resolve();
  }

  setLocalSorage(key: string, value: string) {
    console.log(`Setting to localStorage: ${key}, ${value}`);
    window.localStorage.setItem(`${prefix}-${key}`, value);
  }
}

// IDB store
export class Store {
  private db: IDBDatabase;
  private storeKey: StoreKeys;

  constructor(db: IDBDatabase, storeKey: StoreKeys) {
    this.db = db;
    this.storeKey = storeKey;
  }

  async getIndexedDb<T extends IDbValue>(key: string): Promise<T | null> {
    const tx = this.db.transaction(this.storeKey, "readonly");
    const store = tx.objectStore(this.storeKey);
    const req = store.get(key);
    return new Promise<T | null>((resolve, reject) => {
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

  // ArrayBuffer, Blob, File, and typed arrays like Uint8Array
  async setIndexedDb(key: string, value: IDbValue): Promise<void> {
    const tx = this.db.transaction(this.storeKey, "readwrite");
    const store = tx.objectStore(this.storeKey);
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
}
