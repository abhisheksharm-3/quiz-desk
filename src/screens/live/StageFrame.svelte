<!-- Shared frame of every round stage: title bar with the clock at top right, the stage body, the status line, a compact team strip, the control bar and the keys. -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { buildSheet } from '../../lib/domain/scoresheet';
  import type { Quiz, Round } from '../../lib/domain/types';
  import ControlBar, { type Command } from './ControlBar.svelte';
  import TeamStrip from './TeamStrip.svelte';

  let {
    quiz,
    round,
    commands,
    current,
    pickable,
    locked = [],
    keyed = false,
    status = null,
    onpick,
    timer,
    children,
  }: {
    quiz: Quiz;
    round: Round;
    commands: Command[];
    current: number | null;
    pickable: boolean;
    locked?: number[];
    keyed?: boolean;
    status?: string | null;
    onpick: (index: number) => void;
    timer?: Snippet;
    children: Snippet;
  } = $props();

  const totals = $derived(buildSheet(quiz).totals);
  const picker = $derived(
    pickable && !keyed && current !== null
      ? { teams: quiz.teams.map((team) => team.name), current, onpick }
      : null,
  );

  function onKeydown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const chord = event.metaKey || event.ctrlKey;
    if (event.repeat || event.altKey || chord !== (key === 'z')) return;
    const command = commands.find((candidate) => candidate.key === key);
    if (!command) return;
    event.preventDefault();
    if (!command.disabled) command.run();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<main class="stage">
  <header>
    <div class="titles">
      <p class="round">{round.name}</p>
      <h1>{quiz.title}</h1>
      {#if quiz.quizMasters}<p class="masters">Quiz master {quiz.quizMasters}</p>{/if}
    </div>
    <p class="status" role="status">{status ?? ''}</p>
    {#if timer}<div class="clock">{@render timer()}</div>{/if}
  </header>

  <section class="body" aria-live="off">
    {@render children()}
  </section>

  <TeamStrip teams={quiz.teams} {totals} {current} {pickable} {locked} {keyed} {onpick} />
  <ControlBar {commands} {picker} />
</main>

<style>
  .stage {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    height: 100dvh;
    padding: var(--safe-y) var(--safe-x);
  }

  header {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    min-height: 4.5rem;
  }

  .titles {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-3);
    min-width: 0;
  }

  h1 {
    color: var(--muted);
    font-size: var(--step-1);
    font-weight: 600;
    letter-spacing: 0;
  }

  .round {
    padding: 0 var(--space-3);
    border-radius: var(--radius-pill);
    background: var(--accent-bg);
    color: var(--accent-fg);
    font-size: var(--step-1);
    font-weight: 800;
  }

  .masters {
    color: var(--muted);
    font-size: var(--step--1);
  }

  .clock {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .body {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    flex: 1 1 0;
    min-height: 0;
  }

  .body :global(.notice) {
    display: grid;
    gap: var(--space-3);
    justify-items: start;
    align-self: center;
  }

  .body :global(.notice h2) {
    font-size: var(--step-5);
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .body :global(.notice p) {
    color: var(--muted);
    font-size: var(--step-2);
  }

  .status {
    flex: 1 1 0;
    color: var(--accent);
    font-size: var(--step-2);
    font-weight: 700;
    text-align: end;
  }
</style>
