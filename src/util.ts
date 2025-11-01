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

const hasMouse = window.matchMedia(
  "(hover: hover) and (pointer: fine)",
).matches;
export function isTouchDevice() {
  return !hasMouse;
}

export async function toBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result.split(",")[1]); // Get only the base64 part
      } else {
        reject(new Error("Failed to read file as base64 string."));
      }
    };
    reader.onerror = () => {
      reject(new Error("Error reading file."));
    };
    reader.readAsDataURL(file);
  });
}

export const sortingIncludingBigInt = (
  a: bigint | number,
  b: bigint | number,
): number => {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

export async function toBlob(
  base64: string,
  mimeType: string = "application/octet-stream",
): Promise<Blob> {
  const response = await fetch(`data:${mimeType};base64,${base64}`);
  return await response.blob();
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
