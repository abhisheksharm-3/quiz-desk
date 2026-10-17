import { describe, expect, it } from 'vitest';
import { findDuplicate, textKeys } from './duplicate';
import { addQuestion, addRound, addTeam, createQuiz, emptyAppData } from './quiz';
import { readyCheck } from './ready';
import type { Quiz, QuestionDraft, RoundType } from './types';

const input = { title: 'T', level: 'Block level', subject: 'Science quiz', venue: '', quizMasters: '' };
const filled: QuestionDraft = {
  en: 'What is 1+1?',
  hi: '',
  options: null,
  correctOption: null,
  answerEn: '2',
  answerHi: '',
  image: null,
};

function quizWith(rounds: { name: string; type: RoundType; questions: Partial<QuestionDraft>[] }[]): Quiz {
  const quiz = createQuiz(emptyAppData(), input);
  addTeam(quiz, 'A');
  addTeam(quiz, 'B');
  for (const spec of rounds) {
    const round = addRound(quiz, spec.name, spec.type);
    for (const question of spec.questions) addQuestion(round, { ...filled, ...question });
  }
  return quiz;
}

function questions(count: number, patch: Partial<QuestionDraft> = {}) {
  return Array.from({ length: count }, () => patch);
}

describe('readyCheck', () => {
  it('asks for at least 2 teams', () => {
    const quiz = quizWith([{ name: 'Physics', type: 'standard', questions: questions(10) }]);
    quiz.teams.pop();
    expect(readyCheck(quiz)).toEqual(['Add at least 2 teams']);
  });

  it('asks for at least 1 round', () => {
    expect(readyCheck(quizWith([]))).toEqual(['Add at least 1 round']);
  });

  it('counts the questions a standard round is short by, using its position and name', () => {
    const quiz = quizWith([
      { name: 'A', type: 'standard', questions: questions(10) },
      { name: 'B', type: 'standard', questions: questions(10) },
      { name: 'Chemistry', type: 'standard', questions: questions(7) },
    ]);
    expect(readyCheck(quiz)).toEqual(['Round 3 "Chemistry" has 7 questions, needs 10']);
  });

  it('applies the 10-question minimum to buzzer and rapid fire rounds', () => {
    const quiz = quizWith([
      { name: 'Buzz', type: 'buzzer', questions: questions(9) },
      { name: 'Rapid', type: 'rapid', questions: questions(1) },
    ]);
    expect(readyCheck(quiz)).toEqual([
      'Round 1 "Buzz" has 9 questions, needs 10',
      'Round 2 "Rapid" has 1 question, needs 10',
    ]);
  });

  it('reports an empty picture round and needs no 10-item minimum', () => {
    const empty = quizWith([{ name: 'Pictures', type: 'picture', questions: [] }]);
    expect(readyCheck(empty)).toEqual(['Round 1 "Pictures" has no pictures']);
    const one = quizWith([{ name: 'Pictures', type: 'picture', questions: [{ en: '', image: 'p.png' }] }]);
    expect(readyCheck(one)).toEqual([]);
  });

  it('requires an image, not a caption, from a picture item', () => {
    const quiz = quizWith([{ name: 'Pictures', type: 'picture', questions: [{ en: 'caption', image: null }] }]);
    expect(readyCheck(quiz)).toEqual(['Round 1 "Pictures", picture 1 has no image']);
  });

  it('flags a question with no text and one with no answer, by round and question number', () => {
    const rows = questions(10);
    rows[3] = { en: '', hi: '' };
    rows[4] = { answerEn: '', answerHi: '' };
    const quiz = quizWith([
      { name: 'First', type: 'standard', questions: questions(10) },
      { name: 'Physics', type: 'standard', questions: rows },
    ]);
    expect(readyCheck(quiz)).toEqual([
      'Round 2 "Physics", question 4 has no text',
      'Round 2 "Physics", question 5 has no answer',
    ]);
  });

  it('rejects a correct option whose text is empty or missing', () => {
    const rows = questions(10);
    rows[0] = { options: ['1', '2', '', ''], correctOption: 'C' };
    rows[1] = { options: null, correctOption: 'B' };
    const quiz = quizWith([{ name: 'Physics', type: 'standard', questions: rows }]);
    expect(readyCheck(quiz)).toEqual([
      'Round 1 "Physics", question 1: option C is marked correct but has no text',
      'Round 1 "Physics", question 2: option B is marked correct but has no text',
    ]);
  });

  it('accepts a correct option as the answer', () => {
    const rows = questions(10, { answerEn: '', correctOption: 'B', options: ['1', '2', '3', '4'] });
    expect(readyCheck(quizWith([{ name: 'Physics', type: 'standard', questions: rows }]))).toEqual([]);
  });
});

describe('findDuplicate', () => {
  const quiz = quizWith([
    {
      name: 'Physics',
      type: 'standard',
      questions: [{ en: 'what is h2o', hi: 'पानी क्या है?' }, { en: 'Other', hi: '' }],
    },
  ]);
  const [first, other] = quiz.rounds[0].questions;

  it('ignores case, spacing and trailing punctuation', () => {
    expect(findDuplicate(quiz, { en: 'What is  H2O?', hi: '' })).toBe(first);
  });

  it('matches on Hindi text and ignores the danda', () => {
    expect(findDuplicate(quiz, { en: 'new', hi: ' पानी  क्या है ।' })).toBe(first);
  });

  it('does not match two blank fields', () => {
    expect(findDuplicate(quiz, { en: '', hi: '' })).toBeNull();
  });

  it('compares two drafts the same way, so repeats inside one import are caught', () => {
    expect(textKeys({ en: 'What is  H2O?', hi: '' })).toEqual(textKeys({ en: 'what is h2o', hi: '' }));
    expect(textKeys({ en: '', hi: '' })).toEqual([]);
  });

  it('skips the question being edited', () => {
    expect(findDuplicate(quiz, { en: 'Other', hi: '' }, other.id)).toBeNull();
  });
});
