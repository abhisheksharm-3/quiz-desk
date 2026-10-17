<!-- Result phase banner: Correct or Wrong, who scored, the points and the answer. -->
<script lang="ts">
  import type { Points } from '../../lib/domain/types';

  let {
    correct,
    teamName,
    points,
    answer,
  }: {
    correct: boolean;
    teamName: string | null;
    points: Points;
    answer: { en: string | null; hi: string | null };
  } = $props();

  const sign = $derived(points > 0 ? `+${points}` : String(points));
</script>

<section class="banner" class:correct aria-live="polite">
  <p class="verdict">
    {correct ? 'Correct' : 'Wrong'}
    {#if teamName}<span class="award">{teamName} {sign}</span>{:else}<span class="award">No team scored</span>{/if}
  </p>
  {#if answer.en || answer.hi}
    <p class="answer">
      <span class="label">Answer</span>
      {#if answer.en}<span>{answer.en}</span>{/if}
      {#if answer.hi}<span lang="hi">{answer.hi}</span>{/if}
    </p>
  {/if}
</section>

<style>
  .banner {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border: 2px solid var(--wrong);
    border-radius: var(--radius);
  }

  .correct {
    border-color: var(--right);
  }

  .verdict {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-2) var(--space-4);
    color: var(--wrong);
    font-size: var(--step-4);
    font-weight: 800;
    line-height: 1.1;
  }

  .correct .verdict {
    color: var(--right);
  }

  .award {
    color: var(--fg);
    font-size: var(--step-2);
    font-weight: 600;
  }

  .answer {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-1) var(--space-4);
    font-size: var(--step-3);
    font-weight: 600;
  }

  .label {
    color: var(--muted);
    font-size: var(--step-0);
    font-weight: 400;
  }
</style>
