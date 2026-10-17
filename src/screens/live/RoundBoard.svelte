<!-- Round board: every round with its type and questions left; opens one. -->
<script lang="ts">
  import Button from '../../components/Button.svelte';
  import { ROUND_TYPE_LABELS } from '../../lib/domain/questions';
  import type { Quiz } from '../../lib/domain/types';

  let {
    quiz,
    onopen,
    onback,
  }: { quiz: Quiz; onopen: (roundId: string) => void; onback: () => void } = $props();

  function left(round: Quiz['rounds'][number]): number {
    return round.questions.filter((question) => question.askedAt === null).length;
  }
</script>

<main class="board">
  <header>
    <h1>{quiz.title}</h1>
    <Button type="button" onclick={onback}>Back to quizzes</Button>
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
          <button type="button" onclick={() => onopen(round.id)}>
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
    max-width: 64rem;
    margin: 0 auto;
    padding: var(--safe-y) var(--safe-x);
  }

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  ol {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  button {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: var(--space-4);
    align-items: baseline;
    width: 100%;
    padding: var(--space-3) var(--space-4);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: transparent;
    color: var(--fg);
    font: inherit;
    text-align: start;
    cursor: pointer;
  }

  .name {
    font-size: var(--step-3);
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  .type {
    color: var(--muted);
  }

  .count {
    min-width: 10ch;
    color: var(--accent);
    font-size: var(--step-1);
    font-weight: 600;
    text-align: end;
  }

  .done {
    color: var(--muted);
  }

  .empty {
    display: grid;
    gap: var(--space-2);
  }

  @media (max-width: 40rem) {
    button {
      grid-template-columns: 1fr;
    }

    .count {
      text-align: start;
    }
  }
</style>
