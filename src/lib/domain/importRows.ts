/** Turns spreadsheet rows into question drafts, reporting every bad row by its spreadsheet row number. */

import { correctOptionProblem, OPTION_LETTERS } from './options';
import type { Option, QuestionDraft, Quiz } from './types';

export const TEMPLATE_COLUMNS = [
  'Round',
  'Question (English)',
  'Question (Hindi)',
  'Option A',
  'Option B',
  'Option C',
  'Option D',
  'Correct option',
  'Answer (English)',
  'Answer (Hindi)',
] as const;

export interface ImportItem {
  roundId: string;
  draft: QuestionDraft;
}

export interface Sheet {
  headers: string[];
  rows: Record<string, unknown>[];
}

export interface ImportError {
  row: number;
  message: string;
}

const OPTION_COLUMNS = ['Option A', 'Option B', 'Option C', 'Option D'] as const;
const FIRST_DATA_ROW = 2;

/** `row` is the spreadsheet row number, with the header as row 1. Blank rows are skipped without an error. */
export function parseQuestionRows(quiz: Quiz, { headers, rows }: Sheet): { items: ImportItem[]; errors: ImportError[] } {
  const items: ImportItem[] = [];
  const errors: ImportError[] = [];
  const missing = TEMPLATE_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length > 0) {
    return { items, errors: [{ row: 1, message: `The header row is missing: ${missing.join(', ')}. Start from the template.` }] };
  }
  rows.forEach((raw, index) => {
    const row = index + FIRST_DATA_ROW;
    const cells = Object.fromEntries(TEMPLATE_COLUMNS.map((column) => [column, cellText(raw[column])]));
    if (TEMPLATE_COLUMNS.every((column) => cells[column] === '')) return;
    const result = parseRow(quiz, cells);
    if (typeof result === 'string') errors.push({ row, message: `Row ${row}: ${result}` });
    else items.push(result);
  });
  return { items, errors };
}

function parseRow(quiz: Quiz, cells: Record<string, string>): ImportItem | string {
  const roundName = cells['Round'];
  const round = quiz.rounds.find((candidate) => candidate.name.trim().toLowerCase() === roundName.toLowerCase());
  if (!round) return `no round named "${roundName}"`;
  if (round.type === 'picture') return 'add pictures by hand, not by import';
  if (!cells['Question (English)'] && !cells['Question (Hindi)']) return 'question text is empty';
  const letter = cells['Correct option'].toUpperCase();
  if (letter && !OPTION_LETTERS.includes(letter as Option)) return 'correct option must be A, B, C or D';
  const options = OPTION_COLUMNS.map((column) => cells[column]);
  const hasOptions = options.some(Boolean);
  const correctOption = letter ? (letter as Option) : null;
  const problem = correctOptionProblem(hasOptions ? options : null, correctOption);
  if (problem) return problem;
  return {
    roundId: round.id,
    draft: {
      en: cells['Question (English)'],
      hi: cells['Question (Hindi)'],
      options: hasOptions ? options : null,
      correctOption,
      answerEn: cells['Answer (English)'],
      answerHi: cells['Answer (Hindi)'],
      image: null,
    },
  };
}

function cellText(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim();
}
