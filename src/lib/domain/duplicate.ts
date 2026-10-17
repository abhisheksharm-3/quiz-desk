/** Finds an existing question whose English or Hindi text matches a draft, ignoring case, spacing and punctuation. */

import type { Question, QuestionDraft, Quiz } from './types';

const IGNORED_PUNCTUATION = /[?.!,:;।]/g;

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(IGNORED_PUNCTUATION, '').replace(/\s+/g, ' ').trim();
}

export function findDuplicate(
  quiz: Quiz,
  draft: Pick<QuestionDraft, 'en' | 'hi'>,
  ignoreId?: string,
): Question | null {
  const en = normalizeText(draft.en);
  const hi = normalizeText(draft.hi);
  const matches = (candidate: string, wanted: string) => wanted !== '' && normalizeText(candidate) === wanted;
  for (const round of quiz.rounds) {
    for (const question of round.questions) {
      if (question.id === ignoreId) continue;
      if (matches(question.en, en) || matches(question.hi, hi)) return question;
    }
  }
  return null;
}
