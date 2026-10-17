/** Finds an existing question whose English or Hindi text matches a draft, ignoring case, spacing and punctuation. */

import type { Question, QuestionDraft, Quiz } from './types';

const IGNORED_PUNCTUATION = /[?.!,:;।]/g;

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(IGNORED_PUNCTUATION, '').replace(/\s+/g, ' ').trim();
}

function sameText(candidate: string, wanted: string): boolean {
  const normalized = normalizeText(wanted);
  return normalized !== '' && normalizeText(candidate) === normalized;
}

/** True when the English or the Hindi text of two drafts match, ignoring case, spacing and punctuation. */
export function sameQuestion(a: Pick<QuestionDraft, 'en' | 'hi'>, b: Pick<QuestionDraft, 'en' | 'hi'>): boolean {
  return sameText(a.en, b.en) || sameText(a.hi, b.hi);
}

export function findDuplicate(
  quiz: Quiz,
  draft: Pick<QuestionDraft, 'en' | 'hi'>,
  ignoreId?: string,
): Question | null {
  for (const round of quiz.rounds) {
    const match = round.questions.find((question) => question.id !== ignoreId && sameQuestion(question, draft));
    if (match) return match;
  }
  return null;
}
