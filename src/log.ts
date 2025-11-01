import { Db, Store } from "./db";

// adapated from lila/ui/lib/src/permalog.ts and
// lila/ui/site/src/unhandledError.ts both AGPL

interface PermaLog {
  init(db: Db): void;
  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  clear(): Promise<void>;
  get(): Promise<string>;
}

export const log: PermaLog = makeLog(100);

export function addExceptionListeners() {
  window.addEventListener("error", async (e) => {
    const loc = e.filename ? ` - (${e.filename}:${e.lineno}:${e.colno})` : "";
    log.error(`${e.message}${loc}\n${e.error?.stack ?? ""}`.trim());
  });

  window.addEventListener("unhandledrejection", async (e) => {
    let reason = e.reason;
    if (typeof reason !== "string")
      try {
        reason = JSON.stringify(e.reason);
      } catch (_) {
        reason = "unhandled rejection, reason not a string";
      }
    log.error(`${reason}`);
  });
}

export function makeLog(windowSize: number): PermaLog {
  let init = (db: Db) => {};
  let lastKey = 0;
  let drift = 0.001;

  const ready = new Promise<Store>((resolve) => {
    init = (db: Db) => {
      resolve(db.stores.log);
    };
  });

  (Error.prototype as any).toJSON ??= function () {
    return { [this.name]: this.message, stack: this.stack };
  };

  function stringify(val: any): string {
    return !val || typeof val === "string" ? String(val) : JSON.stringify(val);
  }

  const writeMsg = (
    level: "log" | "info" | "warn" | "error",
    ...args: any[]
  ): void => {
    switch (level) {
      case "log":
      case "info":
        console.log(...args);
        break;
      case "warn":
        console.warn(...args);
        break;
      case "error":
        console.error(...args);
        break;
    }
    const msg = args.map(stringify).join(" ");
    let nextKey = Date.now();
    if (nextKey === lastKey) {
      nextKey += drift;
      drift += 0.001;
    } else {
      drift = 0.001;
      lastKey = nextKey;
    }
    ready
      .then((store) => {
        store.put(nextKey, msg);
      })
      .catch(console.error);
  };

  const log = (...args: any[]) => writeMsg("log", ...args);
  const info = (...args: any[]) => writeMsg("info", ...args);
  const warn = (...args: any[]) => writeMsg("warn", ...args);
  const error = (...args: any[]) => writeMsg("error", ...args);

  const clear = async () => {
    const store = await ready;
    await store.clear();
    lastKey = 0;
  };

  const get = async (): Promise<string> => {
    const store = await ready;
    try {
      const keys = await store.list();
      if (windowSize >= 0 && keys.length > windowSize)
        await store.remove(
          IDBKeyRange.upperBound(keys[keys.length - windowSize], true),
        );
    } catch (e) {
      console.error(e);
      store.clear();
      // window.indexedDB.deleteDatabase(dbInfo.db ?? dbInfo.store);
      return "";
    }
    const [keys, vals] = await Promise.all([store.list(), store.getMany()]);
    return (keys as number[])
      .map(
        (k, i) =>
          `${new Date(k).toISOString().replace(/[TZ]/g, " ")}${vals[i]}`,
      )
      .join("\n");
  };

  return {
    init,
    log,
    info,
    warn,
    error,
    clear,
    get,
  };
}
