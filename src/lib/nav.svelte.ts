/** Which screen the window shows. A single-window app needs no router. `step` opens setup on a given step. */

import type { SetupStep } from './domain/ready';

export type Nav =
  | { screen: 'home' }
  | { screen: 'setup'; quizId: string; step?: SetupStep }
  | { screen: 'live'; quizId: string; roundId: string | null }
  | { screen: 'scores'; quizId: string };

export const nav: Nav = $state({ screen: 'home' });

/** Replaces the current screen in place so every reader of `nav` updates. */
export function go(next: Nav): void {
  for (const key of Object.keys(nav)) delete (nav as Record<string, unknown>)[key];
  Object.assign(nav, next);
}
