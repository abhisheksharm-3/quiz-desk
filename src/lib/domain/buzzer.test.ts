import { describe, expect, it } from 'vitest';
import { buzzerReducer, type BuzzerAction, type BuzzerState } from './buzzer';

const open: BuzzerState = { phase: 'open', questionId: 'q', locked: [] };

function run(start: BuzzerState, actions: BuzzerAction[], teamCount = 4): BuzzerState {
  return actions.reduce((state, action) => buzzerReducer(state, action, teamCount), start);
}

describe('buzzerReducer', () => {
  it('moves from start through the countdown to open', () => {
    const started = run({ phase: 'idle' }, [{ type: 'start', questionId: 'q' }]);
    expect(started).toEqual({ phase: 'countdown', questionId: 'q' });
    expect(run(started, [{ type: 'countdownDone' }])).toEqual(open);
  });

  it('gives the floor to the first team that buzzes', () => {
    expect(run(open, [{ type: 'buzz', team: 2 }])).toEqual({ phase: 'answering', questionId: 'q', team: 2, locked: [] });
  });

  it('locks a team out after a wrong answer while others can still buzz', () => {
    const afterWrong = run(open, [{ type: 'buzz', team: 2 }, { type: 'wrong' }]);
    expect(afterWrong).toEqual({ phase: 'open', questionId: 'q', locked: [2] });
    expect(run(afterWrong, [{ type: 'buzz', team: 2 }])).toBe(afterWrong);
    expect(run(afterWrong, [{ type: 'buzz', team: 0 }])).toMatchObject({ phase: 'answering', team: 0, locked: [2] });
  });

  it('ends the question with no scorer when every team has answered wrong', () => {
    const state = run(open, [0, 1, 2, 3].flatMap((team): BuzzerAction[] => [{ type: 'buzz', team }, { type: 'wrong' }]));
    expect(state).toEqual({ phase: 'result', questionId: 'q', correct: false, team: null });
  });

  it('ends the question with the team that answered right', () => {
    expect(run(open, [{ type: 'buzz', team: 1 }, { type: 'right' }])).toEqual({
      phase: 'result', questionId: 'q', correct: true, team: 1,
    });
  });

  it('ignores a buzz during the countdown', () => {
    const counting: BuzzerState = { phase: 'countdown', questionId: 'q' };
    expect(run(counting, [{ type: 'buzz', team: 0 }])).toBe(counting);
  });

  it('ends a question with no scorer and returns to idle on next', () => {
    const ended = run(open, [{ type: 'end' }]);
    expect(ended).toEqual({ phase: 'result', questionId: 'q', correct: false, team: null });
    expect(run(ended, [{ type: 'next' }])).toEqual({ phase: 'idle' });
  });
});
