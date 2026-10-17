import { describe, expect, it } from 'vitest';
import { addRound, addScore, addTeam, createQuiz, emptyAppData } from './quiz';
import { buildSheet } from './scoresheet';

const input = { title: 'T', level: 'Block level', subject: 'Science quiz', venue: '', quizMasters: '' };

function quizOf(teamCount: number, roundCount: number) {
  const quiz = createQuiz(emptyAppData(), input);
  for (let i = 0; i < teamCount; i++) addTeam(quiz, `Team ${i}`);
  for (let i = 0; i < roundCount; i++) addRound(quiz, `Round ${i}`, 'standard');
  return quiz;
}

function score(quiz: ReturnType<typeof quizOf>, round: number, team: number, points: 10 | 5 | 0 | -5 | -10) {
  addScore(quiz, { roundId: quiz.rounds[round].id, teamId: quiz.teams[team].id, questionId: null, points }, 0);
}

describe('buildSheet', () => {
  it('sums per round and team, totals across rounds, and shows zeros for a round without entries', () => {
    const quiz = quizOf(3, 3);
    score(quiz, 0, 0, 10);
    score(quiz, 0, 0, 5);
    score(quiz, 0, 1, -5);
    score(quiz, 1, 0, 10);
    score(quiz, 1, 2, 10);
    const sheet = buildSheet(quiz);
    expect(sheet.rows.map((row) => row.byTeam)).toEqual([
      [15, -5, 0],
      [10, 0, 10],
      [0, 0, 0],
    ]);
    expect(sheet.rows.map((row) => row.round.id)).toEqual(quiz.rounds.map((round) => round.id));
    expect(sheet.totals).toEqual([25, -5, 10]);
  });

  it('ranks ties together and skips the next rank', () => {
    const quiz = quizOf(4, 1);
    for (const [team, count] of [[0, 4], [1, 3], [2, 3], [3, 1]]) {
      for (let i = 0; i < count; i++) score(quiz, 0, team, 10);
    }
    const sheet = buildSheet(quiz);
    expect(sheet.totals).toEqual([40, 30, 30, 10]);
    expect(sheet.ranks).toEqual([1, 2, 2, 4]);
  });

  it('ignores scores of a round that no longer exists', () => {
    const quiz = quizOf(1, 1);
    addScore(quiz, { roundId: 'gone', teamId: quiz.teams[0].id, questionId: null, points: 10 }, 0);
    expect(buildSheet(quiz).totals).toEqual([0]);
  });
});
