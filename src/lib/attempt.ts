/** Runs a rule-checked action and returns the teacher-facing message when a QuizRuleError refuses it. */

import { QuizRuleError } from './domain/quiz';

export function attempt(action: () => void): string | null {
  try {
    action();
    return null;
  } catch (error) {
    if (error instanceof QuizRuleError) return error.message;
    throw error;
  }
}
