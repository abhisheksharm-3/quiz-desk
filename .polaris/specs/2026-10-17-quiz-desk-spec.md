# Quiz desk: design

A desktop app for running live inter-school quiz competitions (Block, District and State level science, maths, Hindi and history quizzes) in a hall. It replaces an old browser-based quiz tool whose screens are garish and hard to read from the back of a hall (see the reference screenshots from the client: magenta/yellow side panel, grey Score Board table).

## Intent

One teacher sits at one laptop and runs the whole competition. The laptop screen is mirrored to a projector or TV, so the hall sees exactly what the teacher sees. Up to 10 school teams sit in the same hall. The teacher enters all content before the event and, on the day, only operates the quiz.

Success is a quiz day where the teacher never fights the software: every click is obvious, the screen reads clearly from the back row, scores add themselves up, and no question ever appears twice.

## Goals

1. Set up a quiz: name, level, subject, quiz master names, teams, rounds, questions, pictures.
2. Run each round live on a mirrored projector with timer, sounds, reveal and scoring.
3. Keep a score sheet that fills itself in round by round and shows totals and final ranking.
4. Run on Windows and macOS, fully offline, start in under a second, feel snappy.

## Non-goals

- No accounts, login, cloud sync or network features. The old app's "Logout" goes away.
- No team-facing devices. Teams never touch a screen.
- No separate presenter screen. One shared mirrored screen was chosen over a two-screen teacher console.

## Anti-goals (a failure even if it works)

- Small text, low contrast, or clutter that the back of a hall cannot read.
- The correct answer visible on the projector before the teacher reveals it.
- A question or picture repeating after it has been asked.
- Losing scores or entered questions because the app closed or crashed.
- Needing internet on quiz day (fonts, sounds and images all bundled or stored locally).

## Constraints

- Platforms: Windows 10/11 and macOS. Lightweight, Electron only as a last resort.
- Bilingual content: every question is entered in English and Hindi (Devanagari).
- Limits: up to 10 teams, up to 7 named rounds, at least 10 questions per round.
- Timer at most 30 seconds per question.

## Decided by the client

**Quiz types.** The home page lets the teacher create quizzes and tag each with a level (Block, District, State) and a subject (Science quiz, Maths quiz, Hindi quiz, History quiz, ...). Both lists are editable, so the teacher can add new levels and subjects.

**Teams.** Up to 10 per quiz. Each name is editable, typically the school's name, and can be changed during the quiz.

**Rounds.** Up to 7 per quiz, named freely (Physics, Chemistry, Biology, General Science, Tie round, ...). Names are editable.

**Questions.** Each question has English and Hindi text and is entered before the quiz starts. A round needs at least 10 questions. A question that has been asked is never asked again.

**Picture round.** One picture round. Pictures are added before the quiz and never repeat once shown.

**Scoring.** Per answer the teacher awards one of +10, +5, 0, −5, −10.

**Pass.** A question can be passed to another team, as in the old app's "Pass question to team".

**Timer.** Up to 30 seconds per question. In the last 10 seconds an alarm sound counts down. A 3-second tone plays before each question starts.

**Right or wrong.** After marking, the screen shows clearly whether the answer was right or wrong, along with the correct answer.

**Score sheet.** Filled in automatically for every round, with totals per team.

**Buzzer round,** if possible.

**Rapid fire round.** One minute per team. The teacher asks as many questions as fit in the minute. Right is +1, wrong is −1.

**Teacher controls everything.** All actions come from the teacher at the laptop.

**Look.** Black background, white question text. Score, team name and round name are highlighted, either in yellow or as dark blue text on orange labels (the client accepted both).

## Builder's calls (made by me, open to correction)

**Stack.** Tauri 2 with a Svelte 5 + Vite + TypeScript frontend. Tauri uses the OS webview, so the installer is about 10 MB and startup is near instant, compared with roughly 150 MB for Electron. Svelte compiles to small, fast DOM code with no virtual DOM. Rust is not installed on this Mac yet; installing rustup is part of the build.

**Storage.** One JSON file (`quiz-desk.json`) in the app data folder, rewritten atomically (temp file, then rename) after every action, so a crash loses nothing. The data is a few hundred kilobytes at most, so a database adds nothing. Pictures are copied into the app data folder when added, so moving or deleting the original file breaks nothing.

**Question shape.** Each question has English text, Hindi text, an optional four options (A–D, for MCQ rounds), and a correct answer (an option letter or free text, also in both languages). The old app has both MCQ rounds and open-answer rounds (for example "0.53 A°" with no options).

**Language on screen.** By default both languages show stacked, English above Hindi. A toggle on the quiz switches to English only or Hindi only.

**Round types.** Each round has a type: Standard, Picture, Rapid fire or Buzzer. Standard covers the named subject rounds. The "one picture round" is a round of type Picture; the app does not hard-limit it to one.

**Live flow, Standard round.** The teacher picks a team (rotates automatically A → B → C ... and can be overridden), presses Start. The 3-second tone plays, the question appears, the timer runs, and the last 10 seconds beep. The teacher judges the answer from their own knowledge or the printed answer key. The answer is never shown on screen before it is revealed.
- **Right:** the teacher clicks a score. The screen shows "Correct" and the answer.
- **Wrong:** the teacher either passes or ends. Pass moves the question to the next team and restarts the timer. A question can pass through every team once. When the chain ends with nobody right, the screen shows "Wrong" and reveals the answer.

Suggested defaults: +10 for direct right, +5 for right on a pass, 0 for wrong. The teacher can click any of the five values. The next direct turn goes to the team after the one that got the question directly, so passes do not cost anyone a turn. The round ends when the teacher ends it or the questions run out.

**Getting questions in.** Two ways, both decided by the client:
- **By hand:** a fast entry form per round, with English and Hindi fields side by side. Enter saves and clears the form for the next question. Hindi is typed with the OS Hindi keyboard.
- **Import from Excel or CSV:** the app gives a template file (one sheet, with a Round column plus English question, Hindi question, options A–D, correct option, and English and Hindi answer columns). Importing shows a preview with errors flagged per row before anything is saved. Picture items are added by hand, since images do not fit in a spreadsheet.

**Answer key.** The setup screen prints an answer key per round (question, answer) for the teacher to hold, because the mirrored screen has no private place to show answers.

**Rule scope.** Questions belong to one quiz. "Never repeat" applies within that quiz. A "Reset asked questions" action in setup, behind a confirmation, allows rehearsals.

**Languages.** Both English and Hindi fields exist on every question. At least one is required, so a Hindi-language quiz can skip English.

**Picture items.** Each picture item has the image, an optional caption question (English and Hindi), and an answer. It plays like a Standard round: rotation, pass, five score values, timer. The 10-item minimum does not apply to picture rounds.

**Buzzer scoring.** The same five score buttons are used, with suggested defaults of +10 right and −5 wrong. After a wrong answer, that team is locked out for the question and the others may buzz again. The timer is the same 30-second maximum.

**Result sheet.** A printable final result sheet (rounds × teams, totals, ranking, quiz name, quiz masters), matching the old app's "Result Card".

**Buzzer round.** No buzzer hardware is assumed. The question shows to all teams. The teacher clicks the team that buzzed or raised a hand first, or presses keys 1–0. Cheap USB buzzer kits act as keyboards, so key 1–0 support makes those work too.

**Rapid fire.** A separate pool of short question–answer pairs per round. A 60-second clock per team. The teacher presses → (right, +1) or ← (wrong, −1) and the next question appears instantly. Rapid fire questions also never repeat.

**No repeats.** Every question and picture is marked as asked the moment it is shown, and stays marked even after a restart. Skipping a shown question does not return it to the pool. While entering questions, the app warns when the text matches an existing question.

**Ready check.** Before a quiz can start, the app lists what is missing (for example "Round 3 has 7 questions, needs 10").

**Sounds.** Generated with the Web Audio API (start tone, countdown beeps, right and wrong stings). There are no audio files, and a mute button is provided.

**Keyboard.** Every live action has a key (Space start, R reveal, number keys for scores, P pass, N next), so the teacher can run the quiz without hunting with the mouse.

**Design.** Typography and visual polish follow the impeccable skill. Fonts are bundled locally and must pair Latin and Devanagari well. Projector readability comes first: question text at least about 48 px at 1080p, high contrast, nothing important in the outer 5% of the screen (projector overscan). Both highlight colour schemes ship as a theme setting.

**Distribution.** macOS builds locally. The Windows installer is built on GitHub Actions on a Windows runner, using the personal GitHub account `abhisheksharm-3`.

## Left to the builder

Component structure, schema details, animation, exact key bindings, and the score sheet layout.
