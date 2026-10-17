# Quiz Desk design contract

Reading this as: projector-first live tool for a school quiz hall, operated by one teacher, in a stark stage-lit language: a dark hall, a bright screen, one loud highlight colour.

Register: product. Dials: VARIANCE 3, MOTION 2, DENSITY 4.

Scene: a teacher at a laptop in a dimmed school hall, the screen mirrored to a projector 15 metres from the back row. Contrast and size beat ornament. The Home screen is the only screen used at arm's length; Live and Scores are read from across the room.

## Colour

Strategy: restrained. Near-black ground, near-white text, one highlight that the teacher picks. OKLCH only; the black is tinted so it does not read as a dead hole on a projector.

| Token | Yellow theme | Orange theme | Use |
|---|---|---|---|
| `--bg` | `oklch(0.13 0.006 85)` | `oklch(0.13 0.006 55)` | page ground |
| `--fg` | `oklch(0.97 0.004 85)` | same | question and body text |
| `--surface` | `oklch(0.18 0.008 85)` | `oklch(0.18 0.008 55)` | cards, panels, menus, team chips: a second neutral layer above `--bg` |
| `--muted` | `oklch(0.74 0.01 85)` | same | secondary text, 7:1 on `--bg` |
| `--line` | `oklch(0.36 0.01 85)` | same | borders and dividers |
| `--accent` | `oklch(0.89 0.18 97)` | `oklch(0.74 0.17 55)` | highlight text, focus ring, timer ring |
| `--accent-fg` | `oklch(0.2 0.04 85)` | `oklch(0.24 0.08 260)` | dark text on a label or filled control |
| `--accent-bg` | `--accent` | `--accent` | label and filled-control background |
| `--right` | `oklch(0.82 0.18 150)` | same | correct, plus points |
| `--wrong` | `oklch(0.7 0.21 25)` | same | wrong, minus points, last 10 seconds |

Both themes fill the primary control and labels with the accent and put dark text on it (near-black on yellow, dark blue on orange). Highlight text that sits on the ground (screen titles, the options' letters, the status line) uses `--accent` itself. Always pair `--accent-fg` with `--accent-bg`; never write one without the other.

## Type

One family designed for both scripts: Anek Latin (Latin) with Anek Devanagari (Hindi) as the fallback in the same stack, so mixed English and Hindi lines share weight and proportions. Numbers use `font-variant-numeric: tabular-nums`.

Scale (`--step--1` to `--step-6`), fluid with `clamp()`. `--step-5` is the question size: 65 px at 1920 wide, never below 39 px at the 1024 minimum window. Body line length stays under 70ch; Devanagari gets `line-height: 1.6` because of its matras.

| Token | Rough size at 1440 | Role |
|---|---|---|
| `--step--1` | 14 px | captions, helper text |
| `--step-0` | 17 px | body, form controls |
| `--step-1` | 21 px | emphasised body, buttons |
| `--step-2` | 27 px | screen sub-headings |
| `--step-3` | 34 px | screen titles |
| `--step-4` | 45 px | stage headings, scores |
| `--step-5` | 53 px | question text |
| `--step-6` | 80 px | timer and total score |

Hierarchy comes from size and weight (400 body, 600 emphasis, 800 display), not from colour or caps.

## Spacing, shape, motion

- Spacing: `--space-1` 0.25rem, `--space-2` 0.5rem, `--space-3` 1rem, `--space-4` 1.5rem, `--space-5` 2.5rem, `--space-6` 4rem. Vary rhythm; do not use one padding everywhere.
- Control height: `--control` 2.75rem, `--control-large` 3.5rem for the stage control bar.
- Radius: `--radius` 0.5rem for controls and dialogs, `--radius-pill` for status labels.
- Safe area: `--safe-x` 5vw horizontal and `--safe-y` 5vh vertical on stage screens, so nothing important sits in the outer 5% (projector overscan).
- Motion: `transform` and `opacity` only, `--dur` 160 ms, `--ease-out` a quart curve. Never `transition: all`. `prefers-reduced-motion: reduce` removes all non-essential animation.
- Focus: a 3 px `--accent` outline with offset on every interactive element, on any ground.

## Flow and hierarchy

One obvious next step per screen: exactly one primary button (solid accent fill, dark text). Everything else is quiet or sits in a menu. Show only the controls that apply to the current state; never show a disabled button for another phase.

- Home: each quiz card shows its status from `readyIssues` ("Setup: n things left" or "Ready to run"). Primary is "Continue setup" (opens the first step with something to fix) or "Start quiz"; "Edit" is quiet; delete lives in the card menu.
- Setup: five steps in a left rail (Details, Teams, Rounds, Questions, Review). Each shows a number or a check. Every step has a one-line hint, and a sticky footer with the primary "Next: <step> →". When a step is empty or a round still needs questions, the primary moves to the add button and "Next" turns quiet. The last step's primary is "Start quiz", disabled until the quiz is ready, with the missing items linked to their step.
- Live: "Choose a round" board of large whole-card buttons, the first unfinished one outlined in the accent. The stage shows the question and options at the largest size that fits (`fitContent` shrinks type, never clips), the timer top right, a compact team strip, and a centred control bar holding only the actions of the current phase. Before a question: "Start question" and a team picker. While asking: "Right +n", "Pass", "Wrong". After: "Next question". Other values, penalties, undo, mute and back sit in the More menu.
- Scores: teams ranked best first, one primary "Back to rounds".

## Components

- Button: native `button`, three variants and two sizes. Primary (`--accent-fg` on `--accent-bg` with a 2 px `--accent` border), quiet (`--fg` on transparent with a `--line` border), danger (`--wrong` text and a 2 px `--wrong` border). Regular is `--control` high, large is `--control-large` and is used on the stage and for first-run calls to action. Disabled uses `disabled`, 45% opacity, no pointer.
- Menu: a native popover opened by an icon-only "..." button (labelled for the screen reader) or a text trigger. Destructive items sit here and always open a confirm dialog.
- Settings: a Menu on Home holding highlight colour and mute.
- Confirm: a dialog with a quiet keep button and a danger confirm button, used for every delete, reset and clear.
- Field: a visible label above a native input or select. Never a placeholder as the label.
- Select with add: a native select whose last option is "Add new…", which swaps in a text input and an Add button.
- Dialog: native `dialog` opened with `showModal()`, so focus is trapped and restored; Escape closes it.
- Key hint: a small outlined key name beside the action it triggers.

## Do

- Show the correct answer only in the result phase. The projector mirrors the laptop.
- Keep every state designed: empty teaches the first step, errors say what failed and how to recover, disabled is inert.
- Keep lists and controls on the Home screen compact; the stage screens carry the size.

## Don't

- No hex colours, pixel one-offs or new fonts outside this file.
- No CDN assets, no network calls.
- No gradient text, side-stripe borders, glass, or identical decorative cards.
- No colour as the only signal: right and wrong also carry a sign and a word.
