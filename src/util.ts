export const capitalizeFirstLetter = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

// Toggle Element of the set, if it's there, remove it, otheriwe, add it
// TODO check if already possible to do (offline)
export function toggleElm<T>(s: Set<T>, elm: T) {
  s.has(elm) ? s.delete(elm) : s.add(elm);
}

export function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

const hasMouse = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;
export function isTouchDevice() {
  return !hasMouse;
}

export const sortingIncludingBigInt = (
  a: bigint | number,
  b: bigint | number,
): number => {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

// https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
export function iteratorToStream(
  iterator: AsyncGenerator<string, void, unknown>,
) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (value) {
        // Convert string to Uint8Array before enqueueing
        controller.enqueue(encoder.encode(value));
      }
      if (done) {
        controller.close();
      }
    },
  });
}

export async function downloadStreamingTextFile(opts: {
  filename: string;
  iterator: AsyncGenerator<string, void, unknown>;
  mimeType?: string;
}) {
  const { filename, iterator, mimeType } = opts;
  const stream = iteratorToStream(iterator);
  const response = new Response(stream, {
    headers: { "Content-Type": "text/plain" },
  });
  const blob = await response.blob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);

  URL.revokeObjectURL(url);
}

export function downloadTextFile(opts: {
  filename: string;
  content: string;
  mimeType?: string;
}) {
  const { filename, content, mimeType } = opts;
  const blob = new Blob([content], {
    type: mimeType ?? "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
