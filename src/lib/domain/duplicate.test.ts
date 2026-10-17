import { describe, expect, it } from 'vitest';
import { findDuplicate, textKeys } from './duplicate';
import { addQuestion, addRound, createQuiz, emptyAppData } from './quiz';

const draft = { en: '', hi: '', options: null, correctOption: null, answerEn: '', answerHi: '', image: null };

function quizWith(en: string, hi: string) {
  const quiz = createQuiz(emptyAppData(), { title: 'T', level: '', subject: '', venue: '', quizMasters: '' });
  const question = addQuestion(addRound(quiz, 'Physics', 'standard'), { ...draft, en, hi });
  return { quiz, question };
}

describe('findDuplicate', () => {
  it.each([
    ['straight quotes', 'What is H2O', '', 'What is "H2O"?', ''],
    ['curly quotes', 'What is H2O', '', 'What is “H2O”?', ''],
    ['a Hindi nukta letter written as one or two characters', '', 'क़', '', 'क़'],
  ])('matches questions that differ only in %s', (_name, en, hi, otherEn, otherHi) => {
    const { quiz, question } = quizWith(en, hi);
    expect(findDuplicate(quiz, { en: otherEn, hi: otherHi })).toBe(question);
  });

  it('does not match an English text against a Hindi one', () => {
    const { quiz } = quizWith('Gold', '');
    expect(findDuplicate(quiz, { en: '', hi: 'Gold' })).toBeNull();
    expect(findDuplicate(quiz, { en: 'Gold', hi: '' })).not.toBeNull();
    expect(findDuplicate(quiz, { en: '', hi: '' })).toBeNull();
  });
});

describe('textKeys', () => {
  it('tags each non-empty text with its language', () => {
    expect(textKeys({ en: ' Gold. ', hi: '' })).toEqual(['en:gold']);
  });
});
