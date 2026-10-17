# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Behavioral Rules

These rules apply to every task unless explicitly overridden.
Bias: caution over speed on non-trivial work.

### Rule 1 — Think Before Coding
State assumptions explicitly. Ask rather than guess.
If multiple interpretations exist, present them — don't pick silently.
Push back when a simpler approach exists. Stop when confused.

### Rule 2 — Simplicity First
Minimum code that solves the problem. Nothing speculative.
No features beyond what was asked. No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
If you write 200 lines and it could be 50, rewrite it.

### Rule 3 — Surgical Changes
Touch only what you must. Don't improve adjacent code, comments, or formatting.
Don't refactor what isn't broken. Match existing style.
Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.

### Rule 4 — Goal-Driven Execution
Define success criteria. Loop until verified.
For multi-step tasks, state a brief plan with numbered steps before touching code.
Strong success criteria let Claude loop independently.

### Rule 5 — Use the Model Only for Judgment Calls
Use for: classification, drafting, summarization, extraction.
Do NOT use for: routing, retries, deterministic transforms.
If code can answer, code answers.

### Rule 6 — Token Budgets Are Not Advisory
If a session is spiraling or re-suggesting rejected fixes, summarize and start fresh.
Surface the breach. Do not silently overrun.

### Rule 7 — Surface Conflicts, Don't Average Them
If two patterns contradict, pick one (more recent / more tested).
Explain why. Flag the other for cleanup. Don't blend conflicting patterns.

### Rule 8 — Read Before You Write
Before adding code, read exports, immediate callers, shared utilities.
If unsure why existing code is structured a certain way, ask.

### Rule 9 — Tests Verify Intent, Not Just Behavior
Tests must encode WHY behavior matters, not just WHAT it does.
A test that can't fail when business logic changes is wrong.

### Rule 10 — Checkpoint After Every Significant Step
Summarize what was done, what's verified, what's left.
Don't continue from a state you can't describe back. If you lose track, stop and restate.

### Rule 11 — Match the Codebase's Conventions, Even if You Disagree
Conformance > taste inside the codebase.
If you think a convention is harmful, surface it. Don't fork it silently.

### Rule 12 — Fail Loud
"Completed" is wrong if anything was skipped silently.
"Tests pass" is wrong if any were skipped.
Default to surfacing uncertainty, not hiding it.

---

## Project

Quiz Desk: a Tauri 2 + Svelte 5 desktop app (macOS and Windows) for running live inter-school quizzes on a mirrored projector. Spec: `.polaris/specs/2026-10-17-quiz-desk-spec.md`. Plan: `.polaris/plans/2026-10-17-quiz-desk-plan.md`. Design contract: `DESIGN.md`.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Frontend in a browser (localStorage instead of the app data file) |
| `pnpm tauri dev` | Desktop app |
| `pnpm test` | Vitest, domain rules |
| `pnpm tauri build` | Local installer |

## Architecture

- `src/lib/domain/` pure TypeScript quiz rules, each with a `.test.ts`
- `src/lib/` store, storage adapter, sound, timer, pictures, spreadsheet IO
- `src/screens/` Home, Setup, Live, Scores, print views
- `src-tauri/` thin Rust shell, only plugin registration

## Gotchas

- Offline only: no CDN fonts or network calls at runtime.
- The projector mirrors the laptop: never render the correct answer before the result phase.
- Git identity `Abhishek Sharma <abhitiku2003@gmail.com>`; GitHub account `abhisheksharm-3` (`gh auth switch -u abhisheksharm-3`).
