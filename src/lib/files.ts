/** Saving and picking spreadsheet files: native dialogs in the app, a download and a file input in a plain browser. */

import { open, save } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';

const SPREADSHEET_TYPES = ['xlsx', 'csv'];

function inTauri(): boolean {
  return '__TAURI_INTERNALS__' in window;
}

/** Saves bytes under a name the teacher picks. Returns false when the teacher cancels. */
export async function saveBytes(name: string, bytes: Uint8Array): Promise<boolean> {
  if (!inTauri()) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([bytes as BlobPart]));
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
    return true;
  }
  const path = await save({ defaultPath: name, filters: [{ name: 'Excel workbook', extensions: ['xlsx'] }] });
  if (!path) return false;
  await writeFile(path, bytes);
  return true;
}

/** Asks for an .xlsx or .csv file and returns its bytes, or null when the teacher cancels. */
export async function pickSpreadsheet(): Promise<Uint8Array | null> {
  if (inTauri()) {
    const path = await open({ filters: [{ name: 'Spreadsheet', extensions: SPREADSHEET_TYPES }] });
    return path ? readFile(path) : null;
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = SPREADSHEET_TYPES.map((type) => `.${type}`).join(',');
    input.addEventListener('cancel', () => resolve(null));
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      file.arrayBuffer().then((buffer) => resolve(new Uint8Array(buffer)), reject);
    });
    input.click();
  });
}
