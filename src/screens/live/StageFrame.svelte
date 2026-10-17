<!-- Shared frame of every round stage: title bar, the stage body, the status line, the team strip, the control bar and the keys. -->
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
    children: Snippet;
  } = $props();

  const totals = $derived(buildSheet(quiz).totals);

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
    <h1>{quiz.title}</h1>
    <p class="round">{round.name}</p>
    {#if quiz.quizMasters}<p class="masters">Quiz master {quiz.quizMasters}</p>{/if}
  </header>

  <section class="body" aria-live="off">
    {@render children()}
  </section>

  {#if status}<p class="status" role="status">{status}</p>{/if}

  <TeamStrip teams={quiz.teams} {totals} {current} {pickable} {locked} {keyed} {onpick} />
  <ControlBar {commands} />
</main>

<style>
  .stage {
    display: grid;
    grid-template-rows: auto 1fr auto;
    grid-auto-rows: auto;
    gap: var(--space-4);
    height: 100dvh;
    padding: var(--safe-y) var(--safe-x);
  }

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-1) var(--space-4);
  }

  h1 {
    font-size: var(--step-2);
  }

  .round {
    padding: 0 var(--space-3);
    border-radius: var(--radius-pill);
    background: var(--accent-bg);
    color: var(--accent-fg);
    font-size: var(--step-1);
    font-weight: 600;
  }

  .masters {
    margin-inline-start: auto;
    color: var(--muted);
  }

  .body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: var(--space-5);
    min-height: 0;
    overflow-y: auto;
  }

  .body > :global(.card) {
    height: 100%;
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
  }

  .body :global(.notice p) {
    color: var(--muted);
    font-size: var(--step-1);
  }

  .status {
    color: var(--accent);
    font-size: var(--step-3);
    font-weight: 700;
  }
</style>
