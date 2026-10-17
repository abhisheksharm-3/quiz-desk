/** Picking the next question of a round and which language lines to show. */

import { OPTION_LETTERS } from './options';
import type { Question, Quiz, Round, RoundType } from './types';

export const ROUND_TYPE_LABELS: Record<RoundType, string> = {
  standard: 'Standard',
  picture: 'Picture',
  buzzer: 'Buzzer',
  rapid: 'Rapid fire',
};

/** The first question in list order that has not been asked, or null when the round is used up. */
export function nextQuestion(round: Round): Question | null {
  return round.questions.find((question) => question.askedAt === null) ?? null;
}

/** The English and Hindi lines for the language mode; empty text becomes null so nothing blank renders. */
export function visibleText(q: Question, mode: Quiz['languageMode']): { en: string | null; hi: string | null } {
  return {
    en: mode !== 'hi' && q.en.trim() ? q.en : null,
    hi: mode !== 'en' && q.hi.trim() ? q.hi : null,
  };
}

/** The answer lines to reveal: the written answer, or the correct option when no answer text was entered. */
export function answerLines(q: Question, mode: Quiz['languageMode']): { en: string | null; hi: string | null } {
  const written = visibleText({ ...q, en: q.answerEn, hi: q.answerHi }, mode);
  if (written.en || written.hi) return written;
  const index = q.correctOption === null ? -1 : OPTION_LETTERS.indexOf(q.correctOption);
  const label = index < 0 ? '' : (q.options?.[index] ?? '');
  return { en: label.trim() ? `${q.correctOption}. ${label}` : null, hi: null };
}
