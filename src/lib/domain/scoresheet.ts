/** The score grid of a quiz: points per round and team, totals, and ranks. */

import type { Quiz, Round } from './types';

export interface Sheet {
  rows: { round: Round; byTeam: number[] }[];
  totals: number[];
  ranks: number[];
}

/** All arrays follow `quiz.teams` order. Ranks use competition ranking, so totals 40, 30, 30, 10 rank 1, 2, 2, 4. Scores of a deleted round count for nothing. */
export function buildSheet(quiz: Quiz): Sheet {
  const rows = quiz.rounds.map((round) => ({
    round,
    byTeam: quiz.teams.map((team) =>
      quiz.scores
        .filter((score) => score.roundId === round.id && score.teamId === team.id)
        .reduce((sum, score) => sum + score.points, 0),
    ),
  }));
  const totals = quiz.teams.map((_, index) => rows.reduce((sum, row) => sum + row.byTeam[index], 0));
  const ranks = totals.map((total) => 1 + totals.filter((other) => other > total).length);
  return { rows, totals, ranks };
}
