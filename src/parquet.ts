import { Db } from "./db";

const LIST_FILES_API_URL =
  "https://huggingface.co/api/datasets/Lichess/chess-puzzles/tree/main/data";

const DOWNLOAD_DIR_URL =
  "https://huggingface.co/datasets/Lichess/chess-puzzles/resolve/main/data";

const REPO_ID = "Lichess/chess-puzzles";
const REVISION = "main";

async function listFiles() {
  const res = await fetch(LIST_FILES_API_URL);
  if (!res.ok) throw new Error(`Failed to fetch file list: ${res.statusText}`);
  const data = await res.json();
  data.filter(node => {
    node.ge
  })
      if (node.type === "file" && node.path.endsWith(".parquet")) {
        files.push(node.path);
      } else if (node.type === "directory") {
        files = files.concat(findParquet(node.entries || [], node.path + "/"));
      }
    }
    return files;
  };

  return findParquet(data);
}

class Parquet {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  // download the .parquet files from the dataset
  download() {}
}


// browser-download-parquet.js
// import { listFiles, downloadFile } from "@huggingface/hub";
// import { openDB } from "idb";

// const REPO_ID = "Lichess/chess-puzzles";
// const REVISION = "main";

// // 1️⃣ Open or create IndexedDB
// const db = await openDB("lichess-puzzles", 1, {
//   upgrade(db) {
//     db.createObjectStore("parquet-files");
//   },
// });

// // 2️⃣ List all parquet files in the dataset
// async function listParquetFiles() {
//   const files = await listFiles({ repo: REPO_ID, revision: REVISION });
//   return files
//     .filter((f) => f.type === "file" && f.path.endsWith(".parquet"))
//     .map((f) => f.path);
// }

// // 3️⃣ Download and cache each file in IndexedDB
// async function downloadAndStore(filePath) {
//   console.log(`⬇️ Downloading ${filePath} ...`);
//   const file = await downloadFile({
//     repo: REPO_ID,
//     path: filePath,
//     revision: REVISION,
//   });

//   // Convert to ArrayBuffer for storage
//   const buf = await file.arrayBuffer();

//   await db.put("parquet-files", buf, filePath);
//   console.log(`✅ Stored ${filePath} in IndexedDB`);
// }

// // 4️⃣ Main workflow
// async function main() {
//   const parquetFiles = await listParquetFiles();
//   console.log(`Found ${parquetFiles.length} parquet files.`);
//   for (const f of parquetFiles) {
//     // Skip if already in IDB
//     const exists = await db.get("parquet-files", f);
//     if (exists) {
//       console.log(`⚡ Already cached: ${f}`);
//       continue;
//     }
//     await downloadAndStore(f);
//   }
//   console.log("🎉 All parquet files cached locally!");
// }

// main().catch(console.error);

// [
//     {
//         "type": "file",
//         "oid": "85e574f09fea1687ec673bd57a2364bcd59a87ee",
//         "size": 165360489,
//         "lfs":
//         {
//             "oid": "fe49479f7960ad2bb3ff7cc679c346c4265f72977514842495f718b7f7280968",
//             "size": 165360489,
//             "pointerSize": 134
//         },
//         "xetHash": "d4e974b5181d8be09645d7a2e87c37010793e8ce4f550f765663563244f4b4fd",
//         "path": "data/train-00000-of-00003.parquet"
//     },
//     {
//         "type": "file",
//         "oid": "53c103d55667703431b79a4bc612acc55fa22374",
//         "size": 165382924,
//         "lfs":
//         {
//             "oid": "24b7f6eb72c2a37adab0e44fbb28ec5e21bbcf2587d9b5e3cc8e8431a2bbd471",
//             "size": 165382924,
//             "pointerSize": 134
//         },
//         "xetHash": "927cbd762954c335438b400f21cfad0db7941115b6cd1a22d263b87b7f2fb940",
//         "path": "data/train-00001-of-00003.parquet"
//     },
//     {
//         "type": "file",
//         "oid": "0ebe9597cd17f4fb89ab73dc8a3edb6800fa1460",
//         "size": 165382450,
//         "lfs":
//         {
//             "oid": "efe301168bc3f8595b3f3fa8a06b2b31a8216a7d3c52ef36e981b806c697c978",
//             "size": 165382450,
//             "pointerSize": 134
//         },
//         "xetHash": "58365cf6389ef0b32e1cabded565a49fdd99ca33598ab276e9230c4bf5c14a6a",
//         "path": "data/train-00002-of-00003.parquet"
//     }
// ]
