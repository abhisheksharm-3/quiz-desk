/** Finds an existing question whose English or Hindi text matches a draft, ignoring case, spacing, quotes, punctuation and how a Hindi letter is encoded. */

import type { Question, QuestionDraft, Quiz } from './types';

type QuestionText = Pick<QuestionDraft, 'en' | 'hi'>;

const IGNORED_PUNCTUATION = /[?.!,:;।"'`‘’“”]/g;

function normalizeText(text: string): string {
  return text.normalize('NFC').toLowerCase().replace(IGNORED_PUNCTUATION, '').replace(/\s+/g, ' ').trim();
}

/** The normalised, language-tagged texts of a question that are not empty. Two questions are the same when they share a key. */
export function textKeys(question: QuestionText): string[] {
  return [
    { language: 'en', text: normalizeText(question.en) },
    { language: 'hi', text: normalizeText(question.hi) },
  ]
    .filter(({ text }) => text !== '')
    .map(({ language, text }) => `${language}:${text}`);
}

export function findDuplicate(quiz: Quiz, draft: QuestionText, ignoreId?: string): Question | null {
  const wanted = new Set(textKeys(draft));
  for (const round of quiz.rounds) {
    const match = round.questions.find(
      (question) => question.id !== ignoreId && textKeys(question).some((key) => wanted.has(key)),
    );
    if (match) return match;
  }
  return null;
}
