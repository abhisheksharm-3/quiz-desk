import { describe, expect, it } from 'vitest';
import { emptyAppData } from './domain/quiz';
import { tauriStorage, type FsApi } from './storage';

function memoryFs() {
  const files = new Map<string, string>();
  const calls: string[] = [];
  const fs: FsApi = {
    async writeTextFile(path, contents) {
      calls.push(`write ${path}`);
      files.set(path, contents);
    },
    async rename(from, to) {
      calls.push(`rename ${from} ${to}`);
      files.set(to, files.get(from)!);
      files.delete(from);
    },
    async readTextFile(path) {
      return files.get(path)!;
    },
    async exists(path) {
      return files.has(path);
    },
    async mkdir() {},
  };
  return { fs, files, calls };
}

describe('tauriStorage', () => {
  it('writes the temp file, then renames it over the real file', async () => {
    const { fs, files, calls } = memoryFs();
    await tauriStorage(fs).save(emptyAppData());
    expect(calls).toEqual(['write quiz-desk.json.tmp', 'rename quiz-desk.json.tmp quiz-desk.json']);
    expect(files.has('quiz-desk.json.tmp')).toBe(false);
  });

  it('keeps the last complete save when a later write dies before the rename', async () => {
    const { fs, files } = memoryFs();
    const storage = tauriStorage(fs);
    const good = emptyAppData();
    good.theme = 'orange';
    await storage.save(good);
    fs.rename = async () => {
      throw new Error('power cut');
    };
    await expect(storage.save(emptyAppData())).rejects.toThrow('power cut');
    expect(files.has('quiz-desk.json.tmp')).toBe(true);
    expect((await storage.load())?.theme).toBe('orange');
  });

  it('returns null when nothing was saved yet', async () => {
    expect(await tauriStorage(memoryFs().fs).load()).toBeNull();
  });
});
