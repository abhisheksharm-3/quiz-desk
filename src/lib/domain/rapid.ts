/** Rapid fire round: one team answers as many questions as it can before its clock runs out. */

import type { Quiz } from './types';

export type RapidState =
  | { phase: 'ready'; team: number }
  | { phase: 'running'; team: number; questionId: string; right: number; wrong: number }
  | { phase: 'done'; team: number; right: number; wrong: number };

export type RapidAction =
  | { type: 'start'; questionId: string | null }
  | { type: 'right'; nextId: string | null }
  | { type: 'wrong'; nextId: string | null }
  | { type: 'timeUp' }
  | { type: 'nextTeam'; team: number };

/** A null question id means the round has no question left, which ends the turn with the counts so far. */
export function rapidReducer(s: RapidState, a: RapidAction): RapidState {
  if (s.phase === 'ready' && a.type === 'start') {
    if (a.questionId === null) return { phase: 'done', team: s.team, right: 0, wrong: 0 };
    return { phase: 'running', team: s.team, questionId: a.questionId, right: 0, wrong: 0 };
  }
  if (s.phase === 'done' && a.type === 'nextTeam') return { phase: 'ready', team: a.team };
  if (s.phase !== 'running') return s;
  if (a.type === 'timeUp') return { phase: 'done', team: s.team, right: s.right, wrong: s.wrong };
  if (a.type !== 'right' && a.type !== 'wrong') return s;

  const right = s.right + (a.type === 'right' ? 1 : 0);
  const wrong = s.wrong + (a.type === 'wrong' ? 1 : 0);
  if (a.nextId === null) return { phase: 'done', team: s.team, right, wrong };
  return { phase: 'running', team: s.team, questionId: a.nextId, right, wrong };
}

/** The team that is up after a restart: the first without a score in the round, or the last team once all have one. */
export function rapidStartTeam(quiz: Quiz, roundId: string): number {
  const scored = new Set(quiz.scores.filter((score) => score.roundId === roundId).map((score) => score.teamId));
  const index = quiz.teams.findIndex((team) => !scored.has(team.id));
  return index < 0 ? quiz.teams.length - 1 : index;
}
