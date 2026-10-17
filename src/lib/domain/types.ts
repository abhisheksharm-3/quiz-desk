/** Data model of Quiz Desk: everything persisted in the single app data file. */

export type RoundType = 'standard' | 'picture' | 'rapid' | 'buzzer';
export type Option = 'A' | 'B' | 'C' | 'D';
export type Points = 10 | 5 | 0 | -5 | -10 | 1 | -1;

export interface Question {
  id: string;
  en: string;
  hi: string;
  options: string[] | null;
  correctOption: Option | null;
  answerEn: string;
  answerHi: string;
  image: string | null;
  askedAt: number | null;
}

export interface Round {
  id: string;
  name: string;
  type: RoundType;
  timerSeconds: number;
  questions: Question[];
}

export interface Team {
  id: string;
  name: string;
}

export interface ScoreEntry {
  id: string;
  roundId: string;
  teamId: string;
  questionId: string | null;
  points: Points;
  at: number;
}

export interface Quiz {
  id: string;
  title: string;
  level: string;
  subject: string;
  venue: string;
  quizMasters: string;
  languageMode: 'both' | 'en' | 'hi';
  teams: Team[];
  rounds: Round[];
  scores: ScoreEntry[];
  createdAt: number;
}

export interface AppData {
  version: 1;
  levels: string[];
  subjects: string[];
  theme: 'yellow' | 'orange';
  muted: boolean;
  quizzes: Quiz[];
}

export type QuestionDraft = Omit<Question, 'id' | 'askedAt'>;
