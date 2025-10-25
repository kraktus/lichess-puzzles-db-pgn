import { expect, test } from "vitest";
import { toBase64, toBlob } from "./util";

// https://onlinefiletools.com/generate-random-binary-file
const randomBin = String.raw`}<#!|'[$[,\'$!(-_/&>"?~"#{|#,;~\\"'<-_)(}'(]=!;((<}/?||<$=_)~<@\=~/^,||#=*|;#[@=;?{|+*%?_}]+!]{,^_|$#>%$>[\^<:|!%?@~/=)%!"&*)?|+[{,"#^<$\}~?'&~,.<.[&}<)'(-)>&{/[:==|%@&@=^'/>&=+(=&?]%:~={-=/"{*/_^-+*.?%<+\@){,$:<:~_[,)=_>'}#=)+}&.$^>^=*=#&^,[$/+"."(`;

test("test toBase64 and toBlob", async () => {
  const originalBlob = new Blob([randomBin], {
    type: "application/octet-stream",
  });
  const base64 = await toBase64(originalBlob);
  const convertedBlob = await toBlob(base64, "application/octet-stream");

  // Compare sizes
  expect(convertedBlob.size).toBe(originalBlob.size);

  // Compare contents
  const originalArrayBuffer = await originalBlob.arrayBuffer();
  const convertedArrayBuffer = await convertedBlob.arrayBuffer();
  expect(new Uint8Array(convertedArrayBuffer)).toEqual(
    new Uint8Array(originalArrayBuffer),
  );
});
