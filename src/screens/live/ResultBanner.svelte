<!-- Result phase banner: Correct or Wrong, who scored, the points and the answer. Sized from the card's --fit scale. -->
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

  const sign = $derived(points > 0 ? `+${points}` : points < 0 ? `−${-points}` : '0');
</script>

<section class="banner" class:correct aria-live="polite">
  <p class="verdict">
    {correct ? '✓ Correct' : '✗ Wrong'}
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
    gap: calc(var(--space-2) * var(--fit, 1));
    padding: calc(var(--space-3) * var(--fit, 1)) calc(var(--space-4) * var(--fit, 1));
    border: 2px solid var(--wrong);
    border-radius: var(--radius);
    background: var(--surface);
  }

  .correct {
    border-color: var(--right);
  }

  .verdict {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-1) var(--space-4);
    color: var(--wrong);
    font-size: calc(var(--step-4) * var(--fit, 1));
    font-weight: 800;
    line-height: 1.1;
  }

  .correct .verdict {
    color: var(--right);
  }

  .award {
    color: var(--fg);
    font-size: 0.55em;
    font-weight: 600;
  }

  .answer {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-1) var(--space-4);
    font-size: calc(var(--step-3) * var(--fit, 1));
    font-weight: 600;
    line-height: 1.25;
  }

  .label {
    color: var(--muted);
    font-size: 0.55em;
    font-weight: 400;
  }
</style>
