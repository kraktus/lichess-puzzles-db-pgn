const prefix = "lipuzzles-csv";
//const objectStore = "db";

// TODO, switch to `idb` package?
type IDbValue = Blob | string | ArrayBuffer | Uint8Array | string[] | number;

const storeKeys = ["log", "parquet"] as const;
type StoreKeys = (typeof storeKeys)[number];

export class Db {
  private inner: IDBDatabase;
  stores: Record<StoreKeys, Store>;

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

  getLocalStorage(key: string): string | null {
    console.log(`Getting from localStorage: ${key}`);
    return window.localStorage.getItem(`${prefix}-${key}`);
  }

  setLocalSorage(key: string, value: string) {
    console.log(`Setting to localStorage: ${key}, ${value}`);
    window.localStorage.setItem(`${prefix}-${key}`, value);
  }
}

function promise<V>(f: () => IDBRequest) {
  return new Promise<V>((resolve, reject) => {
    const res = f();
    res.onsuccess = (e: Event) => resolve((e.target as IDBRequest).result);
    res.onerror = (e: Event) => reject((e.target as IDBRequest).result);
  });
}

// IDB store, based on lila/ui/lib/src/objectStorage.ts, AGPL
export class Store {
  private db: IDBDatabase;
  private storeKey: StoreKeys;

  constructor(db: IDBDatabase, storeKey: StoreKeys) {
    this.db = db;
    this.storeKey = storeKey;
  }

  objectStore = (mode: IDBTransactionMode) => {
    return this.db.transaction(this.storeKey, mode).objectStore(this.storeKey);
  };

  async get<T extends IDbValue>(key: IDBValidKey): Promise<T | null> {
    return promise(() => this.objectStore("readonly").get(key));
  }

  // ArrayBuffer, Blob, File, and typed arrays like Uint8Array
  async put(key: IDbValue, value: IDbValue): Promise<void> {
    return promise(() =>
      this.objectStore("readwrite").put({ id: key, data: value }),
    );
  }

  async clear(): Promise<void> {
    return promise(() => this.objectStore("readwrite").clear());
  }

  async list(): Promise<IDBValidKey[]> {
    return promise(() => this.objectStore("readonly").getAllKeys());
  }

  async getMany<T extends IDbValue>(keys?: IDBKeyRange): Promise<(T | null)[]> {
    return promise(() => this.objectStore("readonly").getAll(keys));
  }

  async remove(key: IDBValidKey | IDBKeyRange): Promise<void> {
    return promise(() => this.objectStore("readwrite").delete(key));
  }
}
