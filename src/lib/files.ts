/** Saving and picking spreadsheet files: native dialogs in the app, a download and a file input in a plain browser. */

import { open, save } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { inTauri } from './storage';

const SPREADSHEET_TYPES = ['xlsx', 'csv'];

/** Saves bytes under a name the teacher picks. Saves nothing when the teacher cancels. */
export async function saveBytes(name: string, bytes: Uint8Array): Promise<void> {
  if (!inTauri()) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([bytes as BlobPart]));
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
    return;
  }
  const path = await save({ defaultPath: name, filters: [{ name: 'Excel workbook', extensions: ['xlsx'] }] });
  if (path) await writeFile(path, bytes);
}

/** Opens the browser file chooser for the given extensions and resolves with the chosen file, or null when the teacher cancels. */
export function pickFile(extensions: string[]): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = extensions.map((extension) => `.${extension}`).join(',');
    input.addEventListener('cancel', () => resolve(null));
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null));
    input.click();
  });
}

/** Asks for an .xlsx or .csv file and returns its bytes, or null when the teacher cancels. */
export async function pickSpreadsheet(): Promise<Uint8Array | null> {
  if (inTauri()) {
    const path = await open({ filters: [{ name: 'Spreadsheet', extensions: SPREADSHEET_TYPES }] });
    return path ? readFile(path) : null;
  }
  const file = await pickFile(SPREADSHEET_TYPES);
  return file ? new Uint8Array(await file.arrayBuffer()) : null;
}
