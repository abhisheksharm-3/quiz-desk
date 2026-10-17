import { describe, expect, it } from 'vitest';
import {
  QuizRuleError,
  addQuestion,
  addRound,
  addScore,
  addTeam,
  createQuiz,
  deleteTeam,
  emptyAppData,
  markAsked,
  renameTeam,
  resetAsked,
  undoLastScore,
  updateRound,
} from './quiz';

const input = { title: 'T', level: 'Block level', subject: 'Science quiz', venue: '', quizMasters: '' };
const draft = { en: 'q', hi: '', options: null, correctOption: null, answerEn: '', answerHi: '', image: null };

function newQuiz() {
  return createQuiz(emptyAppData(), input);
}

describe('limits', () => {
  it('allows 10 teams and refuses the 11th', () => {
    const quiz = newQuiz();
    for (let i = 0; i < 10; i++) addTeam(quiz, `Team ${i}`);
    const act = () => addTeam(quiz, 'Extra');
    expect(act).toThrow(QuizRuleError);
    expect(act).toThrow('A quiz can have at most 10 teams');
  });

  it('allows 7 rounds and refuses the 8th', () => {
    const quiz = newQuiz();
    for (let i = 0; i < 7; i++) addRound(quiz, `Round ${i}`, 'standard');
    const act = () => addRound(quiz, 'Extra', 'standard');
    expect(act).toThrow(QuizRuleError);
    expect(act).toThrow('A quiz can have at most 7 rounds');
  });

  it('refuses a second round with the same name, ignoring case and spacing, on add and rename', () => {
    const quiz = newQuiz();
    addRound(quiz, 'Physics', 'standard');
    const other = addRound(quiz, 'Maths', 'standard');
    expect(() => addRound(quiz, ' physics ', 'standard')).toThrow('A round named "physics" already exists');
    expect(() => updateRound(quiz, other.id, { name: 'PHYSICS' })).toThrow(QuizRuleError);
    updateRound(quiz, other.id, { name: 'maths' });
  });

  it('refuses a second team with the same name, ignoring case and spacing, on add and rename', () => {
    const quiz = newQuiz();
    addTeam(quiz, 'DPS');
    const other = addTeam(quiz, 'KV');
    expect(() => addTeam(quiz, 'dps ')).toThrow('A team named "dps" already exists');
    expect(() => renameTeam(quiz, other.id, 'Dps')).toThrow(QuizRuleError);
    renameTeam(quiz, other.id, 'kv');
  });

  it('caps the timer at 30 seconds for standard rounds and 60 for rapid fire', () => {
    const quiz = newQuiz();
    const standard = addRound(quiz, 'S', 'standard');
    const rapid = addRound(quiz, 'R', 'rapid');
    expect(rapid.timerSeconds).toBe(60);
    const act = () => updateRound(quiz, standard.id, { timerSeconds: 45 });
    expect(act).toThrow(QuizRuleError);
    expect(act).toThrow('The timer can be at most 30 seconds');
    expect(standard.timerSeconds).toBe(30);
    updateRound(quiz, rapid.id, { timerSeconds: 45 });
    expect(rapid.timerSeconds).toBe(45);
    expect(() => updateRound(quiz, rapid.id, { timerSeconds: 999999999 })).toThrow('The timer can be at most 60 seconds');
    expect(rapid.timerSeconds).toBe(45);
  });

  it('resets the timer to the new type default when the type changes', () => {
    const quiz = newQuiz();
    const rapid = addRound(quiz, 'R', 'rapid');
    updateRound(quiz, rapid.id, { type: 'standard' });
    expect(rapid.timerSeconds).toBe(30);
    updateRound(quiz, rapid.id, { type: 'rapid' });
    expect(rapid.timerSeconds).toBe(60);
  });

  it.each([0, -5, 2.5, NaN])('refuses the timer %s', (timerSeconds) => {
    const quiz = newQuiz();
    const round = addRound(quiz, 'S', 'standard');
    const act = () => updateRound(quiz, round.id, { timerSeconds });
    expect(act).toThrow(QuizRuleError);
    expect(act).toThrow('The timer must be a whole number of at least 1 second');
    expect(round.timerSeconds).toBe(30);
  });
});

describe('scores', () => {
  it('refuses to delete a team that has scores', () => {
    const quiz = newQuiz();
    const team = addTeam(quiz, 'A');
    const round = addRound(quiz, 'S', 'standard');
    addScore(quiz, { roundId: round.id, teamId: team.id, questionId: null, points: 10 }, 1);
    const act = () => deleteTeam(quiz, team.id);
    expect(act).toThrow(QuizRuleError);
    expect(act).toThrow('This team has scores. Rename it instead of deleting it');
    expect(quiz.teams).toHaveLength(1);
  });

  it('undoes the newest entry and returns null when empty', () => {
    const quiz = newQuiz();
    const team = addTeam(quiz, 'A');
    const round = addRound(quiz, 'S', 'standard');
    addScore(quiz, { roundId: round.id, teamId: team.id, questionId: null, points: 10 }, 1);
    const newest = addScore(quiz, { roundId: round.id, teamId: team.id, questionId: null, points: -5 }, 2);
    expect(undoLastScore(quiz)).toBe(newest);
    expect(quiz.scores).toHaveLength(1);
    undoLastScore(quiz);
    expect(undoLastScore(quiz)).toBeNull();
  });
});

describe('asked marks', () => {
  it('resetAsked clears every asked mark in every round', () => {
    const quiz = newQuiz();
    const first = addQuestion(addRound(quiz, 'A', 'standard'), draft);
    const second = addQuestion(addRound(quiz, 'B', 'buzzer'), draft);
    markAsked(quiz, first.id, 5);
    markAsked(quiz, second.id, 6);
    expect([first.askedAt, second.askedAt]).toEqual([5, 6]);
    resetAsked(quiz);
    expect([first.askedAt, second.askedAt]).toEqual([null, null]);
  });
});
