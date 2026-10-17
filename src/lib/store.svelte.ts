/** The single reactive AppData object and its ordered persistence queue. */

import { emptyAppData } from './domain/quiz';
import type { AppData, Quiz } from './domain/types';
import { setMuted } from './sound';
import { pickStorage } from './storage';

const storage = pickStorage();
let pendingSave: Promise<void> = Promise.resolve();

export const app: AppData = $state(emptyAppData());
export const saveStatus = $state({ failed: false });

export async function initStore(): Promise<void> {
  const saved = await storage.load();
  if (saved) Object.assign(app, saved);
  setMuted(app.muted);
}

/** Runs the mutation, mirrors the mute flag into the sound module, then queues one save. Saves run strictly in order. */
export function commit(mutate: (data: AppData) => void): void {
  mutate(app);
  setMuted(app.muted);
  const snapshot = $state.snapshot(app);
  pendingSave = pendingSave
    .then(() => storage.save(snapshot))
    .then(() => {
      saveStatus.failed = false;
    })
    .catch((error) => {
      saveStatus.failed = true;
      console.error('Saving quiz data failed', error);
    });
}

export function quizById(id: string): Quiz {
  const quiz = app.quizzes.find((candidate) => candidate.id === id);
  if (!quiz) throw new Error(`Quiz ${id} not found`);
  return quiz;
}
