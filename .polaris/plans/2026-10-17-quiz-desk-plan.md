# Quiz desk implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Tauri desktop app (macOS and Windows) in which one teacher sets up and runs a live inter-school quiz on a mirrored projector, with timer, sounds, pass, buzzer, rapid fire, picture rounds and an automatic score sheet.

**Architecture:** A thin Tauri 2 shell (Rust only registers the fs and dialog plugins) hosts a Svelte 5 single-window app. All rules (turns, pass chains, buzzer lockouts, rapid fire, scoring, ready check, import parsing) live in pure TypeScript modules under `src/lib/domain/`, tested with Vitest. App state is one Svelte `$state` object persisted to a single JSON file through a two-method storage adapter: the Tauri fs plugin in the app, localStorage in a plain browser so screens can be rendered and checked in Chrome during development.

**Tech stack:** Tauri 2.12, Svelte 5, Vite, TypeScript, Vitest, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-dialog`, SheetJS (`xlsx` 0.20.3 from the SheetJS CDN tarball), `@fontsource-variable/anek-latin` and `@fontsource-variable/anek-devanagari` 5.3.0.

**Spec:** `.polaris/specs/2026-10-17-quiz-desk-spec.md`

## Global constraints

- Fully offline: no network requests at runtime. Fonts bundled through fontsource, sounds generated with Web Audio.
- Limits: at most 10 teams per quiz, at most 7 rounds per quiz, timer at most 30 seconds, at least 10 questions in every Standard, Buzzer and Rapid fire round, at least 1 item in a Picture round.
- Score values: +10, +5, 0, −5, −10 for Standard, Picture and Buzzer rounds. Rapid fire: +1 right, −1 wrong, 60 seconds per team.
- The 3-second start tone plays before every question. Beeps sound on each of the last 10 seconds.
- The correct answer never renders on screen before the result phase.
- A question is marked asked the moment it is shown, and is never offered again in that quiz unless the teacher runs "Reset asked questions".
- Look: black background, white question text, highlights for score, team and round in theme `yellow` (yellow text) or `orange` (dark blue text on orange labels). Projector-first: question text at least 48 px at 1920×1080, important content kept out of the outer 5% of the screen.
- Fonts: Anek Latin for Latin text and Anek Devanagari for Hindi, one family designed to match across both scripts. Numbers use `font-variant-numeric: tabular-nums`.
- Polaris rules apply strictly: core standard, `rules/clean-code.md`, `rules/testing.md`, `rules/design.md`, the comments policy (a file-purpose line and doc comments on exports only), and the laziness ladder. Before Task 1, run `/polaris:init` so `.polaris/config.json` exists and the gates are active. Every task ends with `/polaris:gate` in check mode passing on its changeset before the commit. UI tasks render and look before calling the task done. The window minimum is 1024 px, so render checks use 1024, 1440 and 1920 instead of the web 375/768/1440 set.
- Git identity: `Abhishek Sharma <abhitiku2003@gmail.com>` (already set in the repo). GitHub account `abhisheksharm-3`. Creating the remote repo and pushing need the user's go-ahead first.

## Review focus

1. **App closed mid-question (crash, lid closed, power cut):** on reopening, scores and asked marks up to the last click are intact, and the shown question stays asked. Task 2 test: `save` writes via temp file and rename, and `load` returns the last complete save.
2. **A team renamed or deleted after scores exist:** the score sheet keeps working, a rename shows the new name, and deleting a team that has scores is refused with a message. Task 2 test: `deleteTeam` throws `QuizRuleError` when the team has score entries.
3. **Questions run out mid-round:** the stage shows "No questions left in this round" instead of a blank card, and rapid fire ends the team's turn. Tasks 7 and 9 tests: `nextQuestion` returns `null`, and the rapid reducer moves to `done` when given `null`.
4. **Hindi-only or English-only questions under `languageMode: 'both'`:** only the filled language renders, with no empty line or "undefined". Task 7 test on `visibleText`.
5. **Excel rows with blank lines, extra spaces, a lowercase correct option ("c"), or an unknown round name:** blank rows are skipped silently, values are trimmed, the option is normalised to uppercase, and the unknown round becomes a per-row error. Task 5 table test.

---

### Task 1: Scaffold the app

**Files:**
- Create: the `pnpm create tauri-app` output (template `svelte-ts`, identifier `com.abhisheksharma.quizdesk`, product name `Quiz Desk`), `vitest.config.ts`
- Modify: `src-tauri/src/lib.rs`, `src-tauri/capabilities/default.json`, `src-tauri/tauri.conf.json`, `.gitignore`

**Interfaces:**
- Produces: `pnpm dev` (browser), `pnpm tauri dev` (desktop), `pnpm test` (Vitest).

- [ ] **Step 1:** Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y`, then `source ~/.cargo/env && rustc -V`. Expected: a version string.
- [ ] **Step 2:** In a scratch folder, run `pnpm create tauri-app quiz-desk --template svelte-ts --manager pnpm --yes`, then move its contents into the repo root, keeping the existing `.gitignore` lines and merging in the template's.
- [ ] **Step 3:** Run `pnpm add @tauri-apps/plugin-fs @tauri-apps/plugin-dialog @fontsource-variable/anek-latin @fontsource-variable/anek-devanagari https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`, then `pnpm add -D vitest`, then `pnpm tauri add fs` and `pnpm tauri add dialog`.
- [ ] **Step 4:** Window config in `tauri.conf.json`: title `Quiz Desk`, 1280×800, min 1024×640, `backgroundColor` `#000000`. The fs capability allows read and write under `$APPDATA/**` plus reading user-picked files (`fs:allow-read-file` scoped by the dialog). `assetProtocol` is enabled with scope `$APPDATA/pictures/**`.
- [ ] **Step 5:** Add `"test": "vitest run"` to `package.json`. `vitest.config.ts` uses `environment: 'node'` and `include: ['src/**/*.test.ts']`.
- [ ] **Step 6:** Run `pnpm tauri dev`. Expected: a black window titled Quiz Desk opens with the template page. Close it.
- [ ] **Step 7:** Commit the spec, the plan and the scaffold: `git add -A && git commit -m "chore: scaffold Tauri + Svelte app"`.

### Task 2: Data model, rules and persistence

**Files:**
- Create: `src/lib/domain/types.ts`, `src/lib/domain/quiz.ts`, `src/lib/domain/quiz.test.ts`, `src/lib/storage.ts`, `src/lib/storage.test.ts`, `src/lib/store.svelte.ts`

**Interfaces:**
- Produces (types, in `types.ts`):
```ts
export type RoundType = 'standard' | 'picture' | 'rapid' | 'buzzer';
export type Option = 'A' | 'B' | 'C' | 'D';
export type Points = 10 | 5 | 0 | -5 | -10 | 1 | -1;
export interface Question { id: string; en: string; hi: string; options: string[] | null; correctOption: Option | null; answerEn: string; answerHi: string; image: string | null; askedAt: number | null; }
export interface Round { id: string; name: string; type: RoundType; timerSeconds: number; questions: Question[]; }
export interface Team { id: string; name: string; }
export interface ScoreEntry { id: string; roundId: string; teamId: string; questionId: string | null; points: Points; at: number; }
export interface Quiz { id: string; title: string; level: string; subject: string; venue: string; quizMasters: string; languageMode: 'both' | 'en' | 'hi'; teams: Team[]; rounds: Round[]; scores: ScoreEntry[]; createdAt: number; }
export interface AppData { version: 1; levels: string[]; subjects: string[]; theme: 'yellow' | 'orange'; muted: boolean; quizzes: Quiz[]; }
export type QuestionDraft = Omit<Question, 'id' | 'askedAt'>;
```
- Produces (`quiz.ts`, all mutate the passed `AppData` or `Quiz` in place and throw `QuizRuleError` with a user-facing message): `class QuizRuleError extends Error`, `emptyAppData(): AppData` (levels `['Block level','District level','State level']`, subjects `['Science quiz','Maths quiz','Hindi quiz','History quiz']`, theme `'yellow'`), `createQuiz(data, input: Pick<Quiz,'title'|'level'|'subject'|'venue'|'quizMasters'>): Quiz`, `deleteQuiz(data, quizId)`, `addTeam(quiz, name): Team`, `renameTeam(quiz, teamId, name)`, `deleteTeam(quiz, teamId)`, `addRound(quiz, name, type): Round` (timerSeconds 30, or 60 for rapid), `updateRound(quiz, roundId, patch: Partial<Pick<Round,'name'|'type'|'timerSeconds'>>)`, `deleteRound(quiz, roundId)`, `moveRound(quiz, roundId, delta: -1 | 1)`, `addQuestion(round, draft): Question`, `updateQuestion(round, id, draft)`, `deleteQuestion(round, id)`, `markAsked(quiz, questionId, now: number)`, `resetAsked(quiz)`, `addScore(quiz, entry: Omit<ScoreEntry,'id'|'at'>, now: number): ScoreEntry`, `undoLastScore(quiz): ScoreEntry | null`.
- Produces (`storage.ts`): `interface Storage { load(): Promise<AppData | null>; save(data: AppData): Promise<void>; }`, `tauriStorage(): Storage`, `browserStorage(): Storage`, `pickStorage(): Storage` (Tauri when `'__TAURI_INTERNALS__' in window`).
- Produces (`store.svelte.ts`): `app: AppData` (a `$state`), `initStore(): Promise<void>`, `commit(mutate: (data: AppData) => void): void` (runs the mutation, then queues one save; saves run strictly in order), `quizById(id): Quiz`.

- [ ] **Step 1: Write failing tests in `quiz.test.ts`**
  - `addTeam` 10 times succeeds; the 11th throws `QuizRuleError` with message `A quiz can have at most 10 teams`.
  - `addRound` 7 times succeeds; the 8th throws with `A quiz can have at most 7 rounds`.
  - `updateRound(..., { timerSeconds: 45 })` throws `The timer can be at most 30 seconds` for non-rapid rounds.
  - `deleteTeam` on a team with a score entry throws `This team has scores. Rename it instead of deleting it`.
  - `undoLastScore` removes and returns the newest entry, and returns `null` on an empty list.
  - `resetAsked` sets every `askedAt` back to `null`.
- [ ] **Step 2: Write failing tests in `storage.test.ts`** against a `tauriStorage` built on an injected fs object (`{ writeTextFile, rename, readTextFile, exists, mkdir }`) recorded in memory: `save` writes `quiz-desk.json.tmp` and then renames it to `quiz-desk.json`, and `load` returns `null` when the file is missing. Give `tauriStorage(fs = realFs)` that optional parameter for this purpose.
- [ ] **Step 3:** Run `pnpm test`. Expected: FAIL (modules missing).
- [ ] **Step 4:** Implement `types.ts`, `quiz.ts`, `storage.ts`, `store.svelte.ts`. Use `crypto.randomUUID()` for IDs. `tauriStorage` writes under `BaseDirectory.AppData`, creating the folder on first save.
- [ ] **Step 5:** Run `pnpm test`. Expected: PASS.
- [ ] **Step 6:** Commit: `feat: data model, quiz rules and atomic JSON storage`.

### Task 3: Design system, app shell and home screen

**Files:**
- Create: `DESIGN.md`, `src/styles/tokens.css`, `src/styles/base.css`, `src/lib/nav.svelte.ts`, `src/screens/Home.svelte`, `src/components/` (Button, Field, Select-with-add, Dialog, as the screens need them)
- Modify: `src/App.svelte`, `src/main.ts`

**Interfaces:**
- Consumes: `app`, `commit`, `createQuiz`, `deleteQuiz` from Task 2.
- Produces: `nav: { screen: 'home' } | { screen: 'setup'; quizId: string } | { screen: 'live'; quizId: string; roundId: string | null } | { screen: 'scores'; quizId: string }` (`$state`), `go(next: typeof nav)`. CSS custom properties consumed by every later screen: `--bg`, `--fg`, `--muted`, `--line`, `--accent` (highlight colour), `--accent-fg`, `--accent-bg` (orange theme label background; transparent in yellow), `--right`, `--wrong`, `--font-latin`, `--font-deva`, and a type scale `--step--1` … `--step-6` (with `--step-5` at least 48 px at 1080p via `clamp()`). Theme is set by `data-theme="yellow|orange"` on `<html>`.

- [ ] **Step 1:** Invoke the `impeccable` skill and write `DESIGN.md`: tokens, both themes, type scale, spacing, motion (transform and opacity only, `prefers-reduced-motion` honoured), and the do's and don'ts from the global constraints. Reading line: "projector-first live tool for a school quiz hall, operated by one teacher". Also set the VARIANCE, MOTION and DENSITY dials.
- [ ] **Step 2:** Implement `tokens.css` and `base.css` from DESIGN.md. Import both fontsource packages in `main.ts`. Set `font-family: var(--font-latin), var(--font-deva), system-ui` so Devanagari falls through to Anek Devanagari.
- [ ] **Step 3:** Implement `Home.svelte`. It shows a quiz list (title, level · subject, team and round counts, created date), a "New quiz" dialog (title, level, subject, venue, quiz masters), and open, run and delete actions per quiz, with delete behind a confirmation. The level and subject selects each end with "Add new…", which appends to `app.levels` / `app.subjects`. An empty state explains the first step. A small settings popover holds the theme (`yellow` / `orange`) and mute toggles.
- [ ] **Step 4:** Run `pnpm dev`, open it in Chrome, create two quizzes, and screenshot at 1024, 1440 and 1920 wide in both themes. Check against DESIGN.md and fix what is off.
- [ ] **Step 5:** Commit: `feat: design system and home screen`.

### Task 4: Quiz setup screen

**Files:**
- Create: `src/screens/Setup.svelte`, `src/screens/setup/Details.svelte`, `src/screens/setup/Teams.svelte`, `src/screens/setup/Rounds.svelte`, `src/screens/setup/QuestionForm.svelte`, `src/screens/setup/QuestionList.svelte`, `src/lib/domain/ready.ts`, `src/lib/domain/duplicate.ts`, `src/lib/domain/ready.test.ts`, `src/lib/pictures.ts`

**Interfaces:**
- Consumes: Task 2 mutations, `nav`/`go` from Task 3.
- Produces: `readyCheck(quiz: Quiz): string[]` (empty means ready), `findDuplicate(quiz: Quiz, draft: Pick<QuestionDraft,'en'|'hi'>, ignoreId?: string): Question | null`, `importPicture(): Promise<string | null>` (opens the dialog for png/jpg/jpeg/webp, copies the file to `$APPDATA/pictures/<uuid>.<ext>`, and returns that relative path; in the browser it returns a data URL), `pictureSrc(path: string): string` (`convertFileSrc` of the absolute path in Tauri, or the data URL as is).

- [ ] **Step 1: Write failing tests in `ready.test.ts`**
  - A quiz with 1 team returns `Add at least 2 teams`.
  - A quiz with no rounds returns `Add at least 1 round`.
  - A Standard round named `Chemistry` at position 3 with 7 questions returns `Round 3 "Chemistry" has 7 questions, needs 10`.
  - An empty Picture round returns `Round 1 "Pictures" has no pictures`.
  - A question with both `en` and `hi` empty returns `Round 2 "Physics", question 4 has no text`, and one with no answer (no `correctOption` and both answer fields empty) returns `Round 2 "Physics", question 5 has no answer`.
  - `findDuplicate` matches `"What is  H2O?"` against an existing `"what is h2o"` (case, spacing and trailing punctuation ignored), and also matches on `hi`.
- [ ] **Step 2:** Run `pnpm test src/lib/domain/ready.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `ready.ts` and `duplicate.ts`. To normalise, lowercase, strip `?.!,:;।` characters, collapse whitespace, then trim.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Build the setup UI with tabs Details · Teams · Rounds & questions · Ready.
  - Details: title, level, subject, venue, quiz masters, and the language shown on screen (`both` / `en` / `hi`).
  - Teams: add, rename inline, delete, with the count shown as `n / 10`.
  - Rounds: add, rename, type, timer (max 30), reorder, with the count shown as `n / 7`.
  - Question form: English and Hindi side by side, an optional options block A–D with a correct-option picker, and answer EN/HI. Enter in the last field saves and refocuses the first field. A duplicate warning appears inline with "Save anyway". Picture rounds show an "Add picture" drop zone instead of options.
  - Question list: each row shows the number, the text in the quiz's language, and an "asked" badge, with edit and delete.
  - Ready tab: shows the `readyCheck` list, or a green "Ready to start", plus the "Reset asked questions" button with confirmation.
- [ ] **Step 6:** Render in Chrome. Enter 10 questions by keyboard only, including Hindi text, and confirm the Ready tab updates. Screenshot and check against DESIGN.md.
- [ ] **Step 7:** Commit: `feat: quiz setup with ready check and duplicate warning`.

### Task 5: Excel and CSV import, template download

**Files:**
- Create: `src/lib/domain/importRows.ts`, `src/lib/domain/importRows.test.ts`, `src/lib/spreadsheet.ts`, `src/screens/setup/Import.svelte`
- Modify: `src/screens/Setup.svelte` (adds the Import button on the Rounds tab)

**Interfaces:**
- Produces: `TEMPLATE_COLUMNS = ['Round','Question (English)','Question (Hindi)','Option A','Option B','Option C','Option D','Correct option','Answer (English)','Answer (Hindi)'] as const`, `parseQuestionRows(quiz: Quiz, rows: Record<string, unknown>[]): { items: { roundId: string; draft: QuestionDraft }[]; errors: { row: number; message: string }[] }` (`row` is the spreadsheet row number, header = 1), `readSheet(bytes: Uint8Array): Record<string, unknown>[]` (first sheet; SheetJS reads both .xlsx and .csv), `templateBytes(quiz: Quiz): Uint8Array` (header plus one example row per non-picture round).

- [ ] **Step 1: Write the failing table test `importRows.test.ts`** with these rows against a quiz with rounds `Physics` (standard) and `Pictures` (picture):
  | row | input | expected |
  |---|---|---|
  | 2 | Physics, "What is 1+1?", "", options 1/2/3/4, correct "b" | item, `correctOption: 'B'` |
  | 3 | all blank | skipped, no error |
  | 4 | "  physics ", "Speed of light?", answer "3×10⁸ m/s" | item matched case-insensitively, trimmed, `options: null` |
  | 5 | "Maths", "x" | error `Row 5: no round named "Maths"` |
  | 6 | Physics, both question columns blank | error `Row 6: question text is empty` |
  | 7 | Physics, options given, correct "E" | error `Row 7: correct option must be A, B, C or D` |
  | 8 | Pictures, "x" | error `Row 8: add pictures by hand, not by import` |
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement `importRows.ts` and `spreadsheet.ts`.
- [ ] **Step 4:** Run it. Expected: PASS.
- [ ] **Step 5:** Build `Import.svelte`. "Download template" saves via the dialog `save()` plus fs `writeFile`. "Choose file" opens .xlsx/.csv and shows a preview table: valid rows count, errors listed by row, and duplicates (via `findDuplicate`) flagged but importable. "Import n questions" commits.
- [ ] **Step 6:** Download the template, fill in 12 rows in Numbers or Excel (with a deliberate bad row and Hindi text), import it, and confirm the preview and the result.
- [ ] **Step 7:** Commit: `feat: import questions from Excel or CSV`.

### Task 6: Sound and timer

**Files:**
- Create: `src/lib/sound.ts`, `src/lib/timer.svelte.ts`, `src/lib/timer.test.ts`, `src/screens/live/Timer.svelte`

**Interfaces:**
- Produces: `sound.startTone(): Promise<void>` (resolves after 3 s: three rising pips at 0, 1 and 2 s, then a long tone), `sound.beep()` (short, urgent, 880 Hz), `sound.right()`, `sound.wrong()`, `sound.setMuted(muted: boolean)`. `countdownCue(prevLeft: number, left: number): 'beep' | 'end' | null`. `createCountdown(seconds: number, onCue: (cue: 'beep' | 'end') => void): { left: number; running: boolean; start(): void; pause(): void; reset(seconds?: number): void }` (a `$state` object, driven by `requestAnimationFrame` and `performance.now()` so it does not drift). `Timer.svelte` props `{ left: number; total: number }` render a ring plus whole seconds, switching to `--wrong` colour and a pulse for the last 10 seconds.

- [ ] **Step 1: Write the failing table test for `countdownCue`:** `(11.2, 10.9)` → `'beep'`, `(10.4, 10.1)` → `null`, `(1.1, 0.9)` → `'beep'`, `(0.3, 0)` → `'end'`, `(25.0, 24.5)` → `null`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement. The cue fires when `Math.ceil(left)` drops to a value from 10 to 1; `'end'` fires when `left` reaches 0. Sounds use oscillator plus gain envelopes, and the `AudioContext` is created lazily on first use.
- [ ] **Step 4:** Run it. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: countdown timer and generated sounds`.

### Task 7: Live Standard and Picture rounds

**Files:**
- Create: `src/lib/domain/turn.ts`, `src/lib/domain/turn.test.ts`, `src/lib/domain/questions.ts`, `src/screens/Live.svelte`, `src/screens/live/RoundBoard.svelte`, `src/screens/live/StandardStage.svelte`, `src/screens/live/QuestionCard.svelte`, `src/screens/live/TeamStrip.svelte`, `src/screens/live/ControlBar.svelte`, `src/screens/live/ResultBanner.svelte`

**Interfaces:**
- Consumes: `markAsked`, `addScore`, `undoLastScore` (Task 2); `sound`, `createCountdown`, `Timer` (Task 6); `pictureSrc` (Task 4).
- Produces (`turn.ts`):
```ts
export type TurnState =
  | { phase: 'idle'; nextTeam: number }
  | { phase: 'countdown'; questionId: string; team: number; nextTeam: number }
  | { phase: 'asking'; questionId: string; team: number; directTeam: number; tried: number[]; nextTeam: number }
  | { phase: 'result'; questionId: string; correct: boolean; team: number | null; points: Points; nextTeam: number };
export type TurnAction =
  | { type: 'pickTeam'; team: number } | { type: 'start'; questionId: string } | { type: 'countdownDone' }
  | { type: 'right'; points: Points } | { type: 'pass' } | { type: 'end' } | { type: 'next' };
export function turnReducer(s: TurnState, a: TurnAction, teamCount: number): TurnState;
export function suggestedPoints(s: Extract<TurnState, { phase: 'asking' }>): Points;
```
- Produces (`questions.ts`): `nextQuestion(round: Round): Question | null` (first with `askedAt === null`, in list order), `visibleText(q: Question, mode: Quiz['languageMode']): { en: string | null; hi: string | null }` (empty strings become `null`).

- [ ] **Step 1: Write failing tests in `turn.test.ts`** (team count 5 unless stated):
  - From `idle` with `nextTeam 0`: `start` → `countdown` team 0. `countdownDone` → `asking` team 0, `tried [0]`. `right(10)` → `result` correct, team 0, points 10, `nextTeam 1`.
  - `asking` team 0, then `pass` → team 1, `tried [0,1]`. `right(5)` → `result`, team 1, `nextTeam 1`, because passes cost no turn. `suggestedPoints` is 10 before the pass and 5 after.
  - Team count 3, starting at team 2: `pass`, `pass` → team 1. `pass` again → `result` correct false, team `null`, points 0, `nextTeam 0`.
  - `end` while asking → `result` correct false.
  - `pickTeam(3)` in `idle` sets `nextTeam 3`. `pickTeam` outside `idle` returns the state unchanged.
  - `next` from `result` → `idle` with the same `nextTeam`.
  - `nextQuestion` skips asked questions and returns `null` when all are asked.
  - `visibleText` with mode `both` and `hi: ''` returns `{ en: '…', hi: null }`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement `turn.ts` and `questions.ts`.
- [ ] **Step 4:** Run it. Expected: PASS.
- [ ] **Step 5:** Build the live UI.
  - `RoundBoard` lists rounds with their type, the remaining/total question count and a completed state, and opens one.
  - `StandardStage` wires the reducer:
    - On `start`, call `markAsked` and `commit` immediately, run `sound.startTone()`, then dispatch `countdownDone` and start the countdown.
    - The countdown pauses on result.
    - `right` records `addScore` with the chosen points and plays `sound.right()`. A pass that ends the chain plays `sound.wrong()`.
    - The control bar's −5 and −10 buttons record a penalty for the current team without changing phase.
  - Picture rounds render the image at maximum size with the caption text below.
  - `QuestionCard` shows the options grid when present. In the result phase it highlights the correct option green, or shows the answer text, using `ResultBanner` ("Correct" / "Wrong", the answer, and the awarded points).
  - The top bar shows the quiz title, round name and quiz masters, and `TeamStrip` shows all teams with live totals and the current team, all using the accent tokens.
  - `ControlBar` keys: Space = start / next, 1 = right +10, 2 = right +5, 3 = penalty −5, 4 = penalty −10, P = pass, E = end, Cmd/Ctrl+Z = undo last score, M = mute, Esc = back to the round board (not while asking). Each button shows its key.
  - When no questions are left, show `No questions left in this round`.
- [ ] **Step 6:** Render in Chrome at 1920×1080 and 1280×720 in both themes. Play 3 questions, including a full pass chain, and confirm that the answer is not in the DOM before the result phase (search the page text). Screenshot and check against DESIGN.md.
- [ ] **Step 7:** Commit: `feat: live standard and picture rounds with pass chain`.

### Task 8: Buzzer round

**Files:**
- Create: `src/lib/domain/buzzer.ts`, `src/lib/domain/buzzer.test.ts`, `src/screens/live/BuzzerStage.svelte`
- Modify: `src/screens/Live.svelte` (route `buzzer` rounds)

**Interfaces:**
- Produces:
```ts
export type BuzzerState =
  | { phase: 'idle' } | { phase: 'countdown'; questionId: string }
  | { phase: 'open'; questionId: string; locked: number[] }
  | { phase: 'answering'; questionId: string; team: number; locked: number[] }
  | { phase: 'result'; questionId: string; correct: boolean; team: number | null };
export type BuzzerAction =
  | { type: 'start'; questionId: string } | { type: 'countdownDone' } | { type: 'buzz'; team: number }
  | { type: 'right' } | { type: 'wrong' } | { type: 'end' } | { type: 'next' };
export function buzzerReducer(s: BuzzerState, a: BuzzerAction, teamCount: number): BuzzerState;
```

- [ ] **Step 1: Write failing tests** (team count 4):
  - `buzz(2)` in `open` → `answering` team 2.
  - `wrong` → `open` with `locked [2]`. `buzz(2)` is now ignored, and `buzz(0)` → `answering` 0.
  - Wrong answers from all 4 teams → `result` correct false, team `null`.
  - `right` → `result` correct, with the team.
  - `buzz` in `countdown` is ignored.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement `buzzer.ts`.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Build `BuzzerStage`, reusing `QuestionCard`, `TeamStrip`, `ResultBanner` and `Timer`. While open, keys 1–9 and 0 pick teams 1–10 and clicking a team chip does the same. While answering, Enter = right (+10 by default), Backspace = wrong (−5 by default), and the score buttons allow any of the five values. Locked teams render dimmed. The timer runs from open until a result.
- [ ] **Step 6:** Render in Chrome and play a question with two wrong buzzes, then a right one. Confirm the scores.
- [ ] **Step 7:** Commit: `feat: buzzer round with lockouts`.

### Task 9: Rapid fire round

**Files:**
- Create: `src/lib/domain/rapid.ts`, `src/lib/domain/rapid.test.ts`, `src/screens/live/RapidStage.svelte`
- Modify: `src/screens/Live.svelte` (route `rapid` rounds)

**Interfaces:**
- Produces:
```ts
export type RapidState =
  | { phase: 'ready'; team: number }
  | { phase: 'running'; team: number; questionId: string; right: number; wrong: number }
  | { phase: 'done'; team: number; right: number; wrong: number };
export type RapidAction =
  | { type: 'start'; questionId: string | null } | { type: 'right'; nextId: string | null }
  | { type: 'wrong'; nextId: string | null } | { type: 'timeUp' } | { type: 'nextTeam'; team: number };
export function rapidReducer(s: RapidState, a: RapidAction): RapidState;
```

- [ ] **Step 1: Write failing tests:**
  - `start('q1')` → `running`. `right('q2')` → `right 1`, question q2. `wrong('q3')` → `wrong 1`.
  - `right(null)` → `done`.
  - `timeUp` → `done` with the counts kept.
  - `start(null)` → `done` with zeros.
  - `nextTeam(2)` from `done` → `ready` team 2.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement `rapid.ts`.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Build `RapidStage`.
  - Start plays the start tone, then starts a 60-second countdown.
  - → (right arrow) records +1 and ← records −1 via `addScore`, marks the next question asked and shows it instantly. Both keys are also on-screen buttons.
  - A live tally reads `✓ n  ✗ n  = n`. The last 10 seconds beep. At `done`, the team's rapid fire score shows large, then "Next team" goes to the following team.
  - Answers show small under the question after each mark (rapid fire is read and judged fast), never before.
- [ ] **Step 6:** Render in Chrome and run a full 60-second turn. Confirm that the tally matches the score sheet.
- [ ] **Step 7:** Commit: `feat: rapid fire round`.

### Task 10: Score sheet, result sheet and answer key

**Files:**
- Create: `src/lib/domain/scoresheet.ts`, `src/lib/domain/scoresheet.test.ts`, `src/screens/Scores.svelte`, `src/screens/print/ResultSheet.svelte`, `src/screens/print/AnswerKey.svelte`, `src/styles/print.css`
- Modify: `src/screens/Live.svelte` (Scores button and `S` key), `src/screens/Setup.svelte` (Print answer key)

**Interfaces:**
- Produces: `buildSheet(quiz: Quiz): { rows: { round: Round; byTeam: number[] }[]; totals: number[]; ranks: number[] }` (arrays in `quiz.teams` order; ranks use competition ranking, so totals 40, 30, 30, 10 give ranks 1, 2, 2, 4).

- [ ] **Step 1: Write failing tests:** for 3 teams and 2 rounds with entries, `byTeam` sums per round, `totals` sum across rounds, a round with no entries shows zeros, and ties share a rank.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement `scoresheet.ts`.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Build `Scores.svelte` for projector display: rounds × teams grid, a totals row, rank badges, the leader highlighted with the accent, readable at the back of the hall. It updates live because it derives from `app`. Also build the print views, which render only under `@media print` in black on white with the quiz title, level, subject, venue, quiz masters and date. `ResultSheet` shows the grid and ranks. `AnswerKey` shows, per round, the number, question (EN/HI) and answer. Both print through `window.print()`.
- [ ] **Step 6:** Verify `window.print()` opens the system print dialog inside `pnpm tauri dev` on macOS. If it does nothing, stop and report back rather than working around it.
- [ ] **Step 7:** Commit: `feat: live score sheet, printable result sheet and answer key`.

### Task 11: Packaging and Windows build

**Files:**
- Create: `.github/workflows/release.yml`, `src-tauri/icons/*` (generated)
- Modify: `src-tauri/tauri.conf.json` (version `1.0.0`, bundle targets `dmg`, `nsis`)

- [ ] **Step 1:** Design a simple app icon (an SVG at 1024 px, in the accent on black), then run `pnpm tauri icon icon.svg`.
- [ ] **Step 2:** Write `release.yml` with `tauri-apps/tauri-action@v0`, triggered by `v*` tags and `workflow_dispatch`, with a matrix of `macos-latest` (`--target universal-apple-darwin`) and `windows-latest`. It uploads the .dmg and the NSIS .exe to a draft GitHub release.
- [ ] **Step 3:** Run `pnpm tauri build` locally. Expected: a `.dmg` under `src-tauri/target/release/bundle/dmg/`. Install it and run a 3-round quiz end to end with a TV or second display mirrored.
- [ ] **Step 4:** Commit: `chore: icons and release workflow`.
- [ ] **Step 5:** Ask the user before creating the GitHub repo. With their go-ahead, run `gh auth switch -u abhisheksharm-3`, then `gh repo create quiz-desk --private --source . --push`, then `git tag v1.0.0 && git push --tags`, and watch the workflow until the Windows installer is attached.
