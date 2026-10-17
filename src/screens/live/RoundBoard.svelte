<!-- Round board: choose a round; each card shows its type and questions left, and the whole card starts it. -->
<script lang="ts">
  import Button from '../../components/Button.svelte';
  import Kbd from '../../components/Kbd.svelte';
  import { ROUND_TYPE_LABELS } from '../../lib/domain/questions';
  import type { Quiz } from '../../lib/domain/types';

  let {
    quiz,
    onopen,
    onscores,
    onback,
  }: { quiz: Quiz; onopen: (roundId: string) => void; onscores: () => void; onback: () => void } =
    $props();

  const upNext = $derived(quiz.rounds.find((round) => left(round) > 0)?.id ?? null);

  function onKeydown(event: KeyboardEvent): void {
    if (event.key.toLowerCase() !== 's' || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    event.preventDefault();
    onscores();
  }

  function left(round: Quiz['rounds'][number]): number {
    return round.questions.filter((question) => question.askedAt === null).length;
  }
</script>

<svelte:window onkeydown={onKeydown} />

<main class="board">
  <header>
    <div class="heading">
      <p class="quiz">{quiz.title}</p>
      <h1>Choose a round</h1>
    </div>
    <div class="tools">
      <Button type="button" onclick={onscores}>Scores <Kbd key="S" /></Button>
      <Button type="button" onclick={onback}>Back to quizzes</Button>
    </div>
  </header>
  {#if quiz.rounds.length === 0}
    <section class="empty">
      <h2>This quiz has no rounds</h2>
      <p>Add a round and its questions in setup, then run the quiz.</p>
    </section>
  {:else}
    <ol>
      {#each quiz.rounds as round (round.id)}
        {@const remaining = left(round)}
        <li>
          <button type="button" class:next={round.id === upNext} onclick={() => onopen(round.id)}>
            <span class="name">{round.name}</span>
            <span class="type">{ROUND_TYPE_LABELS[round.type]}</span>
            <span class="count" class:done={remaining === 0}>
              {remaining === 0 ? 'Completed' : `${remaining} of ${round.questions.length} left`}
            </span>
          </button>
        </li>
      {/each}
    </ol>
  {/if}
</main>

<style>
  .board {
    display: grid;
    gap: var(--space-5);
    max-width: 72rem;
    margin: 0 auto;
    padding: var(--safe-y) var(--safe-x);
  }

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .quiz {
    color: var(--muted);
    font-size: var(--step-1);
    font-weight: 600;
  }

  h1 {
    color: var(--accent);
    font-size: var(--step-4);
  }

  .tools {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  ol {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  button {
    display: grid;
    align-content: space-between;
    gap: var(--space-1);
    width: 100%;
    min-height: 9rem;
    padding: var(--space-4);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--fg);
    font: inherit;
    text-align: start;
    cursor: pointer;
  }

  button:hover {
    border-color: var(--muted);
  }

  button.next {
    border-color: var(--accent);
  }

  .name {
    font-size: var(--step-3);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.015em;
    overflow-wrap: anywhere;
  }

  .type {
    color: var(--muted);
    font-size: var(--step-0);
  }

  .count {
    margin-block-start: var(--space-3);
    color: var(--accent);
    font-size: var(--step-1);
    font-weight: 600;
  }

  .done {
    color: var(--muted);
  }

  .empty {
    display: grid;
    gap: var(--space-2);
  }

  .empty p {
    color: var(--muted);
  }
</style>
