export const capitalizeFirstLetter = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export function ifAny<T>(l: T[], f: (t: T) => boolean): boolean {
  for (const x of l) {
    if (f(x)) {
      return true;
    }
  }
  return false;
}

// Toggle Element of the set, if it's there, remove it, otheriwe, add it
// TODO check if already possible to do (offline)
export function toggleElm<T>(s: Set<T>, elm: T) {
  s.has(elm) ? s.delete(elm) : s.add(elm);
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

export async function toBlob(
  base64: string,
  mimeType: string = "application/octet-stream",
): Promise<Blob> {
  const response = await fetch(`data:${mimeType};base64,${base64}`);
  return await response.blob();
}
