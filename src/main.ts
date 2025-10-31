import "./style.css";

// /!\ Do not make any actual import from main, as it will be run each time

// `ReadableByteStreamController` is needed by @huggingface/hub.downloadFile with xet: true
// and safari does not support it natively
// if (typeof ReadableByteStreamController === "undefined") {
//   await import("web-streams-polyfill/polyfill");
// }

import { main } from "./ctrl";

main();
