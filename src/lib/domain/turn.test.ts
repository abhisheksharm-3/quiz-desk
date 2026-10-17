import { describe, expect, it } from 'vitest';
import { nextQuestion, visibleText } from './questions';
import { suggestedPoints, turnReducer, type TurnAction, type TurnState } from './turn';
import type { Question, Round } from './types';

type Asking = Extract<TurnState, { phase: 'asking' }>;

const idle = (nextTeam: number): TurnState => ({ phase: 'idle', nextTeam });

function run(start: TurnState, actions: TurnAction[], teamCount = 5): TurnState {
  return actions.reduce((state, action) => turnReducer(state, action, teamCount), start);
}

const toAsking: TurnAction[] = [{ type: 'start', questionId: 'q' }, { type: 'countdownDone' }];

function question(id: string, askedAt: number | null, en = 'Q', hi = ''): Question {
  return { id, en, hi, options: null, correctOption: null, answerEn: '', answerHi: '', image: null, askedAt };
}

describe('turnReducer', () => {
  it('runs a direct right answer and rotates to the next team', () => {
    const started = run(idle(0), [{ type: 'start', questionId: 'q' }]);
    expect(started).toMatchObject({ phase: 'countdown', team: 0 });
    const asking = run(started, [{ type: 'countdownDone' }]);
    expect(asking).toMatchObject({ phase: 'asking', team: 0, tried: [0] });
    expect(run(asking, [{ type: 'right', points: 10 }])).toMatchObject({
      phase: 'result', correct: true, team: 0, points: 10, nextTeam: 1,
    });
  });

  it('passes cost no turn and halve the suggested points', () => {
    const asking = run(idle(0), toAsking) as Asking;
    expect(suggestedPoints(asking)).toBe(10);
    const passed = run(asking, [{ type: 'pass' }]) as Asking;
    expect(passed).toMatchObject({ team: 1, tried: [0, 1] });
    expect(suggestedPoints(passed)).toBe(5);
    expect(run(passed, [{ type: 'right', points: 5 }])).toMatchObject({ team: 1, nextTeam: 1 });
  });

  it('ends the chain with no scorer once every team has passed', () => {
    const lastTeam = run(idle(2), [...toAsking, { type: 'pass' }, { type: 'pass' }], 3);
    expect(lastTeam).toMatchObject({ phase: 'asking', team: 1 });
    expect(run(lastTeam, [{ type: 'pass' }], 3)).toMatchObject({
      phase: 'result', correct: false, team: null, points: 0, nextTeam: 0,
    });
  });

  it('ends a question on demand', () => {
    expect(run(idle(0), [...toAsking, { type: 'end' }])).toMatchObject({ phase: 'result', correct: false });
  });

  it('picks a team only while idle', () => {
    expect(run(idle(0), [{ type: 'pickTeam', team: 3 }])).toEqual(idle(3));
    const asking = run(idle(0), toAsking);
    expect(run(asking, [{ type: 'pickTeam', team: 3 }])).toBe(asking);
  });

  it('returns to idle on the same next team after a result', () => {
    expect(run(idle(4), [...toAsking, { type: 'right', points: 10 }, { type: 'next' }])).toEqual(idle(0));
    expect(run(idle(2), [...toAsking, { type: 'end' }, { type: 'next' }])).toEqual(idle(3));
  });
});

describe('questions', () => {
  it('skips asked questions and returns null when all are asked', () => {
    const round = { questions: [question('a', 1), question('b', null)] } as Round;
    expect(nextQuestion(round)?.id).toBe('b');
    expect(nextQuestion({ questions: [question('a', 1)] } as Round)).toBeNull();
  });

  it('shows only the filled language in both mode', () => {
    expect(visibleText(question('a', null, 'Q', ''), 'both')).toEqual({ en: 'Q', hi: null });
  });

  it('falls back to the other language when the chosen one is empty', () => {
    expect(visibleText(question('a', null, 'Q', 'प्र'), 'hi')).toEqual({ en: null, hi: 'प्र' });
    expect(visibleText(question('a', null, '', 'प्र'), 'en')).toEqual({ en: null, hi: 'प्र' });
    expect(visibleText(question('a', null, 'Q', ''), 'hi')).toEqual({ en: 'Q', hi: null });
  });

  it('reopens a right answer as the same asking turn after a passed question', () => {
    const asking = run(idle(0), [...toAsking, { type: 'pass' }]);
    const result = run(asking, [{ type: 'right', points: 5 }]);
    expect(run(result, [{ type: 'reopen' }])).toEqual({ ...asking, nextTeam: 1 });
  });

  it('does not reopen an ended question', () => {
    const ended = run(idle(0), [...toAsking, { type: 'end' }]);
    expect(run(ended, [{ type: 'reopen' }])).toBe(ended);
  });
});
