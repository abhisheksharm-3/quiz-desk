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
| `--muted` | `oklch(0.74 0.01 85)` | same | secondary text, 7:1 on `--bg` |
| `--line` | `oklch(0.36 0.01 85)` | same | borders and dividers |
| `--accent` | `oklch(0.89 0.18 97)` | `oklch(0.74 0.17 55)` | highlight text, focus ring, timer ring |
| `--accent-fg` | same as `--accent` | `oklch(0.24 0.08 260)` | text on a label or filled control |
| `--accent-bg` | `transparent` | `--accent` | label and filled-control background |
| `--right` | `oklch(0.82 0.18 150)` | same | correct, plus points |
| `--wrong` | `oklch(0.7 0.21 25)` | same | wrong, minus points, last 10 seconds |

Yellow theme highlights are yellow text on black. Orange theme highlights are dark blue text on an orange label. Always pair `--accent-fg` with `--accent-bg`; never write one without the other.

## Type

One family designed for both scripts: Anek Latin (Latin) with Anek Devanagari (Hindi) as the fallback in the same stack, so mixed English and Hindi lines share weight and proportions. Numbers use `font-variant-numeric: tabular-nums`.

Scale (`--step--1` to `--step-6`), fluid with `clamp()`. `--step-5` is the question size: 65 px at 1920 wide, never below 39 px at the 1024 minimum window. Body line length stays under 70ch; Devanagari gets `line-height: 1.5` because of its matras.

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
- Radius: `--radius` 0.5rem for controls and dialogs, `--radius-pill` for status labels.
- Safe area: `--safe` 5vw horizontal and 5vh vertical on stage screens, so nothing important sits in the outer 5% (projector overscan).
- Motion: `transform` and `opacity` only, `--dur` 160 ms, `--ease-out` a quart curve. Never `transition: all`. `prefers-reduced-motion: reduce` removes all non-essential animation.
- Focus: a 3 px `--accent` outline with offset on every interactive element, on any ground.

## Components

- Button: native `button`, three variants. Primary (`--accent-fg` on `--accent-bg` with a 2 px `--accent` border), quiet (`--fg` on transparent with a `--line` border), danger (`--wrong` text and border). Minimum height 2.75rem. Disabled uses `disabled`, 45% opacity, no pointer.
- Field: a visible label above a native input or select. Never a placeholder as the label.
- Select with add: a native select whose last option is "Add new…", which swaps in a text input and an Add button.
- Dialog: native `dialog` opened with `showModal()`, so focus is trapped and restored; Escape closes it.
- Settings: a native popover holding theme and mute.

## Do

- Show the correct answer only in the result phase. The projector mirrors the laptop.
- Keep every state designed: empty teaches the first step, errors say what failed and how to recover, disabled is inert.
- Keep lists and controls on the Home screen compact; the stage screens carry the size.

## Don't

- No hex colours, pixel one-offs or new fonts outside this file.
- No CDN assets, no network calls.
- No gradient text, side-stripe borders, glass, or identical decorative cards.
- No colour as the only signal: right and wrong also carry a sign and a word.
