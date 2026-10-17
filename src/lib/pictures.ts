/** Picture items: choosing an image file and turning a stored picture path into something an img can load. */

import { appDataDir, sep } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { BaseDirectory, copyFile, mkdir } from '@tauri-apps/plugin-fs';

const EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];
const PICTURES_DIR = 'pictures';
const inTauri = '__TAURI_INTERNALS__' in window;
const appDataPath = inTauri ? (await appDataDir()).replace(/[\\/]$/, '') : '';

/** Asks for an image. In the app it copies the file into the app data folder and returns its relative path; in a browser it returns a data URL. Returns null when the teacher cancels. */
export async function importPicture(): Promise<string | null> {
  return inTauri ? copyIntoAppData() : readAsDataUrl();
}

/** The URL an img element loads for a path returned by importPicture. */
export function pictureSrc(path: string): string {
  if (!inTauri) return path;
  return convertFileSrc([appDataPath, ...path.split('/')].join(sep()));
}

async function copyIntoAppData(): Promise<string | null> {
  const picked = await open({ filters: [{ name: 'Pictures', extensions: EXTENSIONS }] });
  if (!picked) return null;
  const extension = picked.split('.').pop()?.toLowerCase();
  const relative = `${PICTURES_DIR}/${crypto.randomUUID()}.${extension}`;
  await mkdir(PICTURES_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
  await copyFile(picked, relative, { toPathBaseDir: BaseDirectory.AppData });
  return relative;
}

function readAsDataUrl(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = EXTENSIONS.map((extension) => `.${extension}`).join(',');
    input.addEventListener('cancel', () => resolve(null));
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    input.click();
  });
}
