import { describe, expect, it } from 'vitest';
import { parseQuestionRows } from './importRows';
import { addRound, createQuiz, emptyAppData } from './quiz';

const input = { title: 'T', level: 'Block level', subject: 'Science quiz', venue: '', quizMasters: '' };

function quizWithRounds() {
  const quiz = createQuiz(emptyAppData(), input);
  const physics = addRound(quiz, 'Physics', 'standard');
  addRound(quiz, 'Pictures', 'picture');
  return { quiz, physics };
}

const blank = {
  Round: '',
  'Question (English)': '',
  'Question (Hindi)': '',
  'Option A': '',
  'Option B': '',
  'Option C': '',
  'Option D': '',
  'Correct option': '',
  'Answer (English)': '',
  'Answer (Hindi)': '',
};

describe('parseQuestionRows', () => {
  it('turns each spreadsheet row into an item, a skip or a per-row error', () => {
    const { quiz, physics } = quizWithRounds();
    const rows = [
      { ...blank, Round: 'Physics', 'Question (English)': 'What is 1+1?', 'Option A': 1, 'Option B': 2, 'Option C': 3, 'Option D': 4, 'Correct option': 'b' },
      { ...blank },
      { ...blank, Round: '  physics ', 'Question (English)': ' Speed of light? ', 'Answer (English)': ' 3×10⁸ m/s ' },
      { ...blank, Round: 'Maths', 'Question (English)': 'x' },
      { ...blank, Round: 'Physics' },
      { ...blank, Round: 'Physics', 'Question (English)': 'x', 'Option A': 'a', 'Correct option': 'E' },
      { ...blank, Round: 'Pictures', 'Question (English)': 'x' },
    ];

    const { items, errors } = parseQuestionRows(quiz, rows);

    expect(items).toEqual([
      {
        roundId: physics.id,
        draft: { en: 'What is 1+1?', hi: '', options: ['1', '2', '3', '4'], correctOption: 'B', answerEn: '', answerHi: '', image: null },
      },
      {
        roundId: physics.id,
        draft: { en: 'Speed of light?', hi: '', options: null, correctOption: null, answerEn: '3×10⁸ m/s', answerHi: '', image: null },
      },
    ]);
    expect(errors).toEqual([
      { row: 5, message: 'Row 5: no round named "Maths"' },
      { row: 6, message: 'Row 6: question text is empty' },
      { row: 7, message: 'Row 7: correct option must be A, B, C or D' },
      { row: 8, message: 'Row 8: add pictures by hand, not by import' },
    ]);
  });

  it.each([
    ['A and B filled, correct C', { 'Option A': 'a', 'Option B': 'b', 'Correct option': 'C' }],
    ['correct option with no options', { 'Correct option': 'B' }],
  ])('rejects a correct option with no text: %s', (_name, cells) => {
    const { quiz } = quizWithRounds();
    const { items, errors } = parseQuestionRows(quiz, [{ ...blank, Round: 'Physics', 'Question (English)': 'x', ...cells }]);
    expect(items).toEqual([]);
    expect(errors).toEqual([
      { row: 2, message: `Row 2: option ${cells['Correct option']} is marked correct but has no text` },
    ]);
  });

  it.each([['round'], ['Round '], ['Question']])('names the missing template headers when the file has "%s"', (header) => {
    const { quiz } = quizWithRounds();
    const { items, errors } = parseQuestionRows(quiz, [{ [header]: 'Physics', 'Question (English)': 'x' }]);
    expect(items).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Round');
    expect(errors[0].message).toContain('Option A');
  });

  it('skips a row of only spaces without an error', () => {
    const { quiz } = quizWithRounds();
    const result = parseQuestionRows(quiz, [{ ...blank, Round: '   ' }]);
    expect(result).toEqual({ items: [], errors: [] });
  });
});
