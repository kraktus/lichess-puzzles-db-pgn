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
  if (s.has(elm)) {
    s.delete(elm);
  } else {
    s.add(elm);
  }
}
