// Thin dynamic-import wrapper so heavy parsing libraries are bundled locally

type PapaParseModule = typeof import('papaparse');

let papaParsePromise: Promise<PapaParseModule> | null = null;
let papaParseResolved = false;

export async function loadPapaParse(): Promise<PapaParseModule> {
  if (!papaParsePromise) {
    papaParsePromise = import('papaparse').then((module) => {
      papaParseResolved = true;
      return module;
    });
  }
  return papaParsePromise;
}

export async function loadRequiredLibraries(): Promise<void> {
  await loadPapaParse();
}

export function isPapaParseLoaded(): boolean {
  return papaParseResolved;
}
