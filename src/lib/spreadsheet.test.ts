import { describe, expect, it } from 'vitest';
import { addRound, createQuiz, emptyAppData } from './domain/quiz';
import { readSheet, templateBytes } from './spreadsheet';

describe('readSheet', () => {
  it('reads Hindi from UTF-8 CSV bytes without garbling it', () => {
    const csv = 'Round,Question (Hindi)\nPhysics,बल की इकाई क्या है?\n';
    expect(readSheet(new TextEncoder().encode(csv))).toEqual([
      { Round: 'Physics', 'Question (Hindi)': 'बल की इकाई क्या है?' },
    ]);
  });

  it('keeps blank rows in place so row numbers match the spreadsheet', () => {
    const rows = readSheet(new TextEncoder().encode('Round,Question (English)\nPhysics,a\n,\nPhysics,b\n'));
    expect(rows.map((row) => row['Question (English)'])).toEqual(['a', '', 'b']);
  });

  it('reads back the template it wrote, one example row per non-picture round', () => {
    const quiz = createQuiz(emptyAppData(), { title: 'T', level: '', subject: '', venue: '', quizMasters: '' });
    addRound(quiz, 'Physics', 'standard');
    addRound(quiz, 'Pictures', 'picture');
    addRound(quiz, 'Rapid', 'rapid');
    const rows = readSheet(templateBytes(quiz));
    expect(rows.map((row) => row['Round'])).toEqual(['Physics', 'Rapid']);
  });
});
