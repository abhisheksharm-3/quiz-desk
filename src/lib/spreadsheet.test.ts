import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { addRound, createQuiz, emptyAppData } from './domain/quiz';
import { readSheet, templateBytes } from './spreadsheet';

describe('readSheet', () => {
  it('reads Hindi from UTF-8 CSV bytes without garbling it', () => {
    const csv = 'Round,Question (Hindi)\nPhysics,बल की इकाई क्या है?\n';
    expect(readSheet(new TextEncoder().encode(csv))).toEqual({
      headers: ['Round', 'Question (Hindi)'],
      rows: [{ Round: 'Physics', 'Question (Hindi)': 'बल की इकाई क्या है?' }],
    });
  });

  it.each([
    ['Curie’s apostrophe as 0x92', [0x52, 0x0a, 0x43, 0x75, 0x72, 0x69, 0x65, 0x92, 0x73]],
    ['Café as 0xE9', [0x52, 0x0a, 0x43, 0x61, 0x66, 0xe9]],
  ])('refuses a CSV in the old Windows encoding: %s', (_name, bytes) => {
    expect(() => readSheet(new Uint8Array(bytes))).toThrow();
  });

  it('reports the headers of a CSV that has only a header row, and no rows', () => {
    expect(readSheet(new TextEncoder().encode('foo,bar'))).toEqual({ headers: ['foo', 'bar'], rows: [] });
  });

  it('keeps blank rows in place so row numbers match the spreadsheet', () => {
    const { rows } = readSheet(new TextEncoder().encode('Round,Question (English)\nPhysics,a\n,\nPhysics,b\n'));
    expect(rows.map((row) => row['Question (English)'])).toEqual(['a', '', 'b']);
  });

  it.each([
    ['1/2', '1/2'],
    ['007', '007'],
    ['TRUE', 'TRUE'],
    ['50%', '50%'],
    ['12345678901234567890', '12345678901234567890'],
  ])('keeps the CSV cell %s as typed text', (cell, expected) => {
    const { rows } = readSheet(new TextEncoder().encode(`Round,Answer (English)\nPhysics,${cell}\n`));
    expect(rows[0]['Answer (English)']).toBe(expected);
  });

  it('reads xlsx date and percentage cells as the text the sheet shows', () => {
    const sheet = XLSX.utils.aoa_to_sheet([['Date', 'Share', 'Plain date'], [new Date(1947, 7, 15), 0.5, new Date(1947, 7, 15)]], { cellDates: true });
    sheet['A2'].z = 'dd-mm-yyyy';
    sheet['B2'].z = '0%';
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Questions');
    const bytes = new Uint8Array(XLSX.write(book, { type: 'array', bookType: 'xlsx' }));
    expect(readSheet(bytes).rows).toEqual([{ Date: '15-08-1947', Share: '50%', 'Plain date': '15/08/1947' }]);
  });

  it('reads back the template it wrote, one example row per non-picture round', () => {
    const quiz = createQuiz(emptyAppData(), { title: 'T', level: '', subject: '', venue: '', quizMasters: '' });
    addRound(quiz, 'Physics', 'standard');
    addRound(quiz, 'Pictures', 'picture');
    addRound(quiz, 'Rapid', 'rapid');
    const { rows } = readSheet(templateBytes(quiz));
    expect(rows.map((row) => row['Round'])).toEqual(['Physics', 'Rapid']);
  });
});
