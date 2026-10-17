import { describe, expect, it } from 'vitest';
import { rapidReducer, type RapidAction, type RapidState } from './rapid';

function run(start: RapidState, actions: RapidAction[]): RapidState {
  return actions.reduce(rapidReducer, start);
}

const ready: RapidState = { phase: 'ready', team: 0 };

describe('rapidReducer', () => {
  it('counts rights and wrongs while moving to the next question', () => {
    const state = run(ready, [
      { type: 'start', questionId: 'q1' },
      { type: 'right', nextId: 'q2' },
      { type: 'wrong', nextId: 'q3' },
    ]);
    expect(state).toEqual({ phase: 'running', team: 0, questionId: 'q3', right: 1, wrong: 1 });
  });

  it('is done with the final answer counted when no question is left', () => {
    const state = run(ready, [{ type: 'start', questionId: 'q1' }, { type: 'right', nextId: null }]);
    expect(state).toEqual({ phase: 'done', team: 0, right: 1, wrong: 0 });
  });

  it('keeps the counts when time is up', () => {
    const state = run(ready, [
      { type: 'start', questionId: 'q1' },
      { type: 'wrong', nextId: 'q2' },
      { type: 'timeUp' },
    ]);
    expect(state).toEqual({ phase: 'done', team: 0, right: 0, wrong: 1 });
  });

  it('is done with zeros when the round has no question to start with', () => {
    expect(run(ready, [{ type: 'start', questionId: null }])).toEqual({ phase: 'done', team: 0, right: 0, wrong: 0 });
  });

  it('readies the next team after a finished turn and ignores answers before the start', () => {
    const done = run(ready, [{ type: 'start', questionId: null }]);
    expect(run(done, [{ type: 'nextTeam', team: 2 }])).toEqual({ phase: 'ready', team: 2 });
    expect(run(ready, [{ type: 'right', nextId: 'q2' }])).toBe(ready);
  });
});
