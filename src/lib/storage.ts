/** Persistence of AppData: one JSON file via the Tauri fs plugin, localStorage in a plain browser. */

import { BaseDirectory, exists, mkdir, readTextFile, rename, writeTextFile } from '@tauri-apps/plugin-fs';
import type { AppData } from './domain/types';

export interface Storage {
  load(): Promise<AppData | null>;
  save(data: AppData): Promise<void>;
}

export interface FsApi {
  writeTextFile(path: string, contents: string, options: { baseDir: BaseDirectory }): Promise<void>;
  rename(
    from: string,
    to: string,
    options: { oldPathBaseDir: BaseDirectory; newPathBaseDir: BaseDirectory },
  ): Promise<void>;
  readTextFile(path: string, options: { baseDir: BaseDirectory }): Promise<string>;
  exists(path: string, options: { baseDir: BaseDirectory }): Promise<boolean>;
  mkdir(path: string, options: { baseDir: BaseDirectory; recursive: boolean }): Promise<void>;
}

const FILE_NAME = 'quiz-desk.json';
const TEMP_NAME = `${FILE_NAME}.tmp`;
const BROWSER_KEY = 'quiz-desk';
const baseDir = BaseDirectory.AppData;

/** Saves go to a temp file and are renamed over the real one, so a crash mid-write leaves the last complete save. */
export function tauriStorage(
  fs: FsApi = { writeTextFile, rename, readTextFile, exists, mkdir },
): Storage {
  return {
    async load() {
      if (!(await fs.exists(FILE_NAME, { baseDir }))) return null;
      return JSON.parse(await fs.readTextFile(FILE_NAME, { baseDir }));
    },
    async save(data) {
      await fs.mkdir('', { baseDir, recursive: true });
      await fs.writeTextFile(TEMP_NAME, JSON.stringify(data), { baseDir });
      await fs.rename(TEMP_NAME, FILE_NAME, { oldPathBaseDir: baseDir, newPathBaseDir: baseDir });
    },
  };
}

export function browserStorage(): Storage {
  return {
    async load() {
      const raw = localStorage.getItem(BROWSER_KEY);
      return raw ? JSON.parse(raw) : null;
    },
    async save(data) {
      localStorage.setItem(BROWSER_KEY, JSON.stringify(data));
    },
  };
}

export function pickStorage(): Storage {
  return '__TAURI_INTERNALS__' in window ? tauriStorage() : browserStorage();
}
