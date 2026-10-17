/** Buzzer round: first team to buzz answers, a wrong answer locks that team out of the question. */

export type BuzzerState =
  | { phase: 'idle' }
  | { phase: 'countdown'; questionId: string }
  | { phase: 'open'; questionId: string; locked: number[] }
  | { phase: 'answering'; questionId: string; team: number; locked: number[] }
  | { phase: 'result'; questionId: string; correct: boolean; team: number | null };

export type BuzzerAction =
  | { type: 'start'; questionId: string }
  | { type: 'countdownDone' }
  | { type: 'buzz'; team: number }
  | { type: 'right' }
  | { type: 'wrong' }
  | { type: 'end' }
  | { type: 'next' };

/** A buzz from a locked team or outside the open phase returns the same state object. */
export function buzzerReducer(s: BuzzerState, a: BuzzerAction, teamCount: number): BuzzerState {
  if (s.phase === 'idle' && a.type === 'start') return { phase: 'countdown', questionId: a.questionId };
  if (s.phase === 'countdown' && a.type === 'countdownDone') {
    return { phase: 'open', questionId: s.questionId, locked: [] };
  }
  if (s.phase === 'result' && a.type === 'next') return { phase: 'idle' };
  if (s.phase === 'open' && a.type === 'buzz') {
    if (s.locked.includes(a.team)) return s;
    return { phase: 'answering', questionId: s.questionId, team: a.team, locked: s.locked };
  }
  if ((s.phase === 'open' || s.phase === 'answering') && a.type === 'end') {
    return { phase: 'result', questionId: s.questionId, correct: false, team: null };
  }
  if (s.phase !== 'answering') return s;
  if (a.type === 'right') return { phase: 'result', questionId: s.questionId, correct: true, team: s.team };
  if (a.type === 'wrong') {
    const locked = [...s.locked, s.team];
    if (locked.length >= teamCount) return { phase: 'result', questionId: s.questionId, correct: false, team: null };
    return { phase: 'open', questionId: s.questionId, locked };
  }
  return s;
}
