# Quiz Desk UX redesign

The user tried the built app and found it clunky and unintuitive: "I couldn't figure out what to do where." Every screen shows many equal-weight outlined buttons and no path. The look (black, white text, yellow accent, Anek fonts) stays. The flow and hierarchy change.

## Principles
- One obvious next step on every screen: exactly one primary button (solid accent fill, dark text). Everything else is secondary (quiet ghost) or tucked into a "More" / ⋯ menu.
- Destructive actions (delete quiz, delete round, delete question, clear scores, reset asked) live in ⋯ menus and always confirm.
- Show only the controls that apply to the current state. Never show disabled buttons for other phases.
- Short helper text says what this screen is for and what to do next.

## Home
- Each quiz card shows its status, computed from readyCheck: "Setup: n things left" or "Ready to run".
- One primary button per card: "Continue setup" when not ready, "Start quiz" when ready. Secondary: "Edit". Delete goes in a ⋯ menu.
- Header: "New quiz" is the primary button; Settings (theme, sound) is a quiet icon or text button.
- Empty state: one big "Create your first quiz" primary button.

## Setup as guided steps
- Left rail stepper: 1 Details, 2 Teams, 3 Rounds, 4 Questions, 5 Review. Each shows done/pending (a check when its readyCheck items are clear). You can click any step.
- Each step has a one-line hint at the top and a primary "Next: <step> →" button at the bottom right. The last step's primary button is "Start quiz" (enabled only when ready; otherwise lists what's missing with links to the step).
- Teams step: a simple list with an add field ("Type a school name, press Enter"), inline rename, ⋯ delete. Shows "n / 10".
- Rounds step: a list of round cards (name, type, timer) with "+ Add round"; editing happens in place on the card; reorder with small up/down icons; delete in ⋯.
- Questions step: a round picker (tabs or a left list), then that round's questions with a prominent "+ Add question" button opening the form (side panel or inline at the top), and "Import from Excel" as a secondary button next to it. Picture rounds show "+ Add picture".
- Review step: the readyCheck list (each item links to its step), "Print answer key", and the rehearsal tools (reset asked, clear scores) in a quiet section.

## Running the quiz
- Round board: heading "Choose a round". Each round is a big card with its name, type and "8 of 10 left", and the whole card starts it. A secondary "Scores" button and "Back to quizzes".
- Question stage: maximise the question and options; options must always fit at 1280×720 and up (scale the type down for long text; never clip). Timer top right. Team strip compact (one row of small chips with scores) along the bottom, current team highlighted.
- Context-only control bar, centred, large:
  - Before the question: the primary "Start question (Space)" button plus a team picker ("Team B is up · change").
  - While asking (standard/picture): "✓ Right" (primary, awards the suggested +10 or +5, label shows the points), "Pass →", "✗ Wrong". Key hints stay.
  - Result: "Next question (Space)" as primary.
  - A "More" menu holds: other point values, penalties −5/−10, undo, mute, back to rounds.
- Buzzer and rapid fire get the same treatment: show only the 2-3 actions of the current phase.
- Scores screen: a big readable table; one primary "Back to round" button.

## Must keep
- All existing behaviour, keys and tests. The answer is never in the DOM before the result phase. pnpm test and pnpm check stay green.
