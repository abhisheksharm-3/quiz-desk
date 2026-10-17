/** Reading and writing question spreadsheets with SheetJS. Reads .xlsx and .csv; writes the .xlsx template. */

import * as XLSX from 'xlsx';
import { TEMPLATE_COLUMNS } from './domain/importRows';
import type { Quiz } from './domain/types';

const ZIP_SIGNATURE = [0x50, 0x4b];
const DATE_FORMAT = 'dd/mm/yyyy';

/**
 * Rows of the first sheet keyed by header text, every cell as the text the teacher sees: 007, 1/2, 50% and dates are not turned into numbers.
 * Empty cells read as empty strings and blank rows are kept, so an index maps to a spreadsheet row. A date shown in the sheet's default format reads as dd/mm/yyyy.
 */
export function readSheet(bytes: Uint8Array): Record<string, unknown>[] {
  const isWorkbook = ZIP_SIGNATURE.every((byte, index) => bytes[index] === byte);
  const book = isWorkbook
    ? XLSX.read(bytes, { type: 'array', raw: true, dateNF: DATE_FORMAT })
    : XLSX.read(new TextDecoder().decode(bytes), { type: 'string', raw: true });
  const sheet = book.Sheets[book.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '', blankrows: true, raw: false, dateNF: DATE_FORMAT });
}

/** The header row plus one example row for each round that takes imported questions. */
export function templateBytes(quiz: Quiz): Uint8Array {
  const examples = quiz.rounds
    .filter((round) => round.type !== 'picture')
    .map((round) => [round.name, 'What is the capital of India?', 'भारत की राजधानी क्या है?', 'Mumbai', 'New Delhi', 'Kolkata', 'Chennai', 'B', 'New Delhi', 'नई दिल्ली']);
  const sheet = XLSX.utils.aoa_to_sheet([[...TEMPLATE_COLUMNS], ...examples]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Questions');
  return new Uint8Array(XLSX.write(book, { type: 'array', bookType: 'xlsx' }));
}
