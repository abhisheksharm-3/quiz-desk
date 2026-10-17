/** The A-D multiple-choice options and the rule that the correct one must have text. */

import type { Option } from './types';

export const OPTION_LETTERS: Option[] = ['A', 'B', 'C', 'D'];

/** A message when `letter` is marked correct but its option text is empty or missing, otherwise null. */
export function correctOptionProblem(options: readonly string[] | null, letter: Option | null): string | null {
  if (!letter) return null;
  return options?.[OPTION_LETTERS.indexOf(letter)]?.trim() ? null : `option ${letter} is marked correct but has no text`;
}
