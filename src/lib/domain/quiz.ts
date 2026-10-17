/** Pure quiz rules. Every function mutates the passed data in place and throws QuizRuleError with a user-facing message. */

import type {
  AppData,
  Question,
  QuestionDraft,
  Quiz,
  Round,
  RoundType,
  ScoreEntry,
  Team,
} from './types';

export const MAX_TEAMS = 10;
export const MAX_ROUNDS = 7;
export const MAX_TIMER_SECONDS = 30;
const DEFAULT_TIMER_SECONDS = 30;
const RAPID_TIMER_SECONDS = 60;

/** A rule violation whose message is safe to show the teacher. */
export class QuizRuleError extends Error {}

export function emptyAppData(): AppData {
  return {
    version: 1,
    levels: ['Block level', 'District level', 'State level'],
    subjects: ['Science quiz', 'Maths quiz', 'Hindi quiz', 'History quiz'],
    theme: 'yellow',
    muted: false,
    quizzes: [],
  };
}

export function createQuiz(
  data: AppData,
  input: Pick<Quiz, 'title' | 'level' | 'subject' | 'venue' | 'quizMasters'>,
): Quiz {
  const quiz: Quiz = {
    id: crypto.randomUUID(),
    ...input,
    languageMode: 'both',
    teams: [],
    rounds: [],
    scores: [],
    createdAt: Date.now(),
  };
  data.quizzes.push(quiz);
  return quiz;
}

export function deleteQuiz(data: AppData, quizId: string): void {
  data.quizzes = data.quizzes.filter((quiz) => quiz.id !== quizId);
}

export function addTeam(quiz: Quiz, name: string): Team {
  if (quiz.teams.length >= MAX_TEAMS) {
    throw new QuizRuleError(`A quiz can have at most ${MAX_TEAMS} teams`);
  }
  const team = { id: crypto.randomUUID(), name };
  quiz.teams.push(team);
  return team;
}

export function renameTeam(quiz: Quiz, teamId: string, name: string): void {
  findTeam(quiz, teamId).name = name;
}

export function deleteTeam(quiz: Quiz, teamId: string): void {
  if (quiz.scores.some((score) => score.teamId === teamId)) {
    throw new QuizRuleError('This team has scores. Rename it instead of deleting it');
  }
  quiz.teams = quiz.teams.filter((team) => team.id !== teamId);
}

export function addRound(quiz: Quiz, name: string, type: RoundType): Round {
  if (quiz.rounds.length >= MAX_ROUNDS) {
    throw new QuizRuleError(`A quiz can have at most ${MAX_ROUNDS} rounds`);
  }
  assertRoundNameFree(quiz, name);
  const round: Round = {
    id: crypto.randomUUID(),
    name,
    type,
    timerSeconds: defaultTimerSeconds(type),
    questions: [],
  };
  quiz.rounds.push(round);
  return round;
}

export function updateRound(
  quiz: Quiz,
  roundId: string,
  patch: Partial<Pick<Round, 'name' | 'type' | 'timerSeconds'>>,
): void {
  const round = findRound(quiz, roundId);
  if (patch.name !== undefined) assertRoundNameFree(quiz, patch.name, roundId);
  const type = patch.type ?? round.type;
  const changesType = type !== round.type;
  const timerSeconds =
    patch.timerSeconds ?? (changesType ? defaultTimerSeconds(type) : round.timerSeconds);
  if (!Number.isInteger(timerSeconds) || timerSeconds < 1) {
    throw new QuizRuleError('The timer must be a whole number of at least 1 second');
  }
  if (type !== 'rapid' && timerSeconds > MAX_TIMER_SECONDS) {
    throw new QuizRuleError(`The timer can be at most ${MAX_TIMER_SECONDS} seconds`);
  }
  Object.assign(round, patch, { type, timerSeconds });
}

function assertRoundNameFree(quiz: Quiz, name: string, exceptId?: string): void {
  const wanted = name.trim().toLowerCase();
  if (quiz.rounds.some((round) => round.id !== exceptId && round.name.trim().toLowerCase() === wanted)) {
    throw new QuizRuleError(`A round named "${name.trim()}" already exists`);
  }
}

export function deleteRound(quiz: Quiz, roundId: string): void {
  quiz.rounds = quiz.rounds.filter((round) => round.id !== roundId);
}

export function moveRound(quiz: Quiz, roundId: string, delta: -1 | 1): void {
  const from = quiz.rounds.findIndex((round) => round.id === roundId);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= quiz.rounds.length) return;
  const [round] = quiz.rounds.splice(from, 1);
  quiz.rounds.splice(to, 0, round);
}

export function addQuestion(round: Round, draft: QuestionDraft): Question {
  const question: Question = { ...draft, id: crypto.randomUUID(), askedAt: null };
  round.questions.push(question);
  return question;
}

export function updateQuestion(round: Round, id: string, draft: QuestionDraft): void {
  const question = round.questions.find((candidate) => candidate.id === id);
  if (!question) throw new QuizRuleError('That question no longer exists');
  Object.assign(question, draft);
}

export function deleteQuestion(round: Round, id: string): void {
  round.questions = round.questions.filter((question) => question.id !== id);
}

export function markAsked(quiz: Quiz, questionId: string, now: number): void {
  for (const round of quiz.rounds) {
    const question = round.questions.find((candidate) => candidate.id === questionId);
    if (question) question.askedAt = now;
  }
}

export function resetAsked(quiz: Quiz): void {
  for (const round of quiz.rounds) {
    for (const question of round.questions) question.askedAt = null;
  }
}

export function addScore(
  quiz: Quiz,
  entry: Omit<ScoreEntry, 'id' | 'at'>,
  now: number,
): ScoreEntry {
  const score = { ...entry, id: crypto.randomUUID(), at: now };
  quiz.scores.push(score);
  return score;
}

export function undoLastScore(quiz: Quiz): ScoreEntry | null {
  return quiz.scores.pop() ?? null;
}

function defaultTimerSeconds(type: RoundType): number {
  return type === 'rapid' ? RAPID_TIMER_SECONDS : DEFAULT_TIMER_SECONDS;
}

function findTeam(quiz: Quiz, teamId: string): Team {
  const team = quiz.teams.find((candidate) => candidate.id === teamId);
  if (!team) throw new QuizRuleError('That team no longer exists');
  return team;
}

function findRound(quiz: Quiz, roundId: string): Round {
  const round = quiz.rounds.find((candidate) => candidate.id === roundId);
  if (!round) throw new QuizRuleError('That round no longer exists');
  return round;
}
