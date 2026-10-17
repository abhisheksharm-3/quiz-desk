/** Turn rotation and pass chain of a Standard or Picture question, as a pure reducer. */

import type { Points } from './types';

export type TurnState =
  | { phase: 'idle'; nextTeam: number }
  | { phase: 'countdown'; questionId: string; team: number; nextTeam: number }
  | { phase: 'asking'; questionId: string; team: number; directTeam: number; tried: number[]; nextTeam: number }
  | { phase: 'result'; questionId: string; correct: boolean; team: number | null; points: Points; nextTeam: number };

export type TurnAction =
  | { type: 'pickTeam'; team: number }
  | { type: 'start'; questionId: string }
  | { type: 'countdownDone' }
  | { type: 'right'; points: Points }
  | { type: 'pass' }
  | { type: 'end' }
  | { type: 'next' };

const DIRECT_POINTS: Points = 10;
const PASSED_POINTS: Points = 5;

/** Passes cost no turn: the next question goes to the team after the one asked directly. */
export function turnReducer(s: TurnState, a: TurnAction, teamCount: number): TurnState {
  if (s.phase === 'idle' && a.type === 'pickTeam') return { ...s, nextTeam: a.team };
  if (s.phase === 'idle' && a.type === 'start') {
    return { phase: 'countdown', questionId: a.questionId, team: s.nextTeam, nextTeam: s.nextTeam };
  }
  if (s.phase === 'countdown' && a.type === 'countdownDone') {
    const { questionId, team, nextTeam } = s;
    return { phase: 'asking', questionId, team, directTeam: team, tried: [team], nextTeam };
  }
  if (s.phase === 'result' && a.type === 'next') return { phase: 'idle', nextTeam: s.nextTeam };
  if (s.phase !== 'asking') return s;

  const afterDirect = (s.directTeam + 1) % teamCount;
  if (a.type === 'right') {
    return { phase: 'result', questionId: s.questionId, correct: true, team: s.team, points: a.points, nextTeam: afterDirect };
  }
  if (a.type === 'end') {
    return { phase: 'result', questionId: s.questionId, correct: false, team: null, points: 0, nextTeam: afterDirect };
  }
  if (a.type === 'pass') {
    if (s.tried.length >= teamCount) return turnReducer(s, { type: 'end' }, teamCount);
    const team = (s.team + 1) % teamCount;
    return { ...s, team, tried: [...s.tried, team] };
  }
  return s;
}

/** 10 points for the team asked directly, 5 once the question has been passed. */
export function suggestedPoints(s: Extract<TurnState, { phase: 'asking' }>): Points {
  return s.tried.length === 1 ? DIRECT_POINTS : PASSED_POINTS;
}
