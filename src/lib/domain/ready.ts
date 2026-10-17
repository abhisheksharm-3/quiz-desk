/** The ready check: everything a quiz still lacks before it can be run. */

import { correctOptionProblem } from './options';
import type { Question, Quiz, Round } from './types';

const MIN_QUESTIONS = 10;
const MIN_TEAMS = 2;

export type SetupStep = 'details' | 'teams' | 'rounds' | 'questions' | 'review';

export interface ReadyIssue {
  text: string;
  step: SetupStep;
  roundId?: string;
}

/** One issue per missing piece, tagged with the setup step that fixes it. An empty list means the quiz is ready. */
export function readyIssues(quiz: Quiz): ReadyIssue[] {
  const issues: ReadyIssue[] = [];
  if (quiz.teams.length < MIN_TEAMS) issues.push({ text: `Add at least ${MIN_TEAMS} teams`, step: 'teams' });
  if (quiz.rounds.length === 0) issues.push({ text: 'Add at least 1 round', step: 'rounds' });
  quiz.rounds.forEach((round, index) => {
    for (const text of roundProblems(round, index + 1)) issues.push({ text, step: 'questions', roundId: round.id });
  });
  return issues;
}

/** Returns one user-facing line per missing piece. An empty list means the quiz is ready. */
export function readyCheck(quiz: Quiz): string[] {
  return readyIssues(quiz).map((issue) => issue.text);
}

function roundProblems(round: Round, position: number): string[] {
  const label = `Round ${position} "${round.name}"`;
  const count = round.questions.length;
  if (round.type === 'picture') {
    if (count === 0) return [`${label} has no pictures`];
    return round.questions.flatMap((question, index) =>
      question.image ? answerProblems(question, `${label}, picture ${index + 1}`) : [`${label}, picture ${index + 1} has no image`],
    );
  }
  const problems: string[] = [];
  if (count < MIN_QUESTIONS) {
    problems.push(`${label} has ${count} ${count === 1 ? 'question' : 'questions'}, needs ${MIN_QUESTIONS}`);
  }
  round.questions.forEach((question, index) => {
    const questionLabel = `${label}, question ${index + 1}`;
    if (!question.en.trim() && !question.hi.trim()) problems.push(`${questionLabel} has no text`);
    problems.push(...answerProblems(question, questionLabel));
  });
  return problems;
}

function answerProblems(question: Question, label: string): string[] {
  const optionProblem = correctOptionProblem(question.options, question.correctOption);
  if (optionProblem) return [`${label}: ${optionProblem}`];
  const answered = question.correctOption || question.answerEn.trim() || question.answerHi.trim();
  return answered ? [] : [`${label} has no answer`];
}
