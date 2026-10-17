<!-- Title block of a printed sheet: the quiz, its level and subject, venue, quiz masters and the print date. -->
<script lang="ts">
  import type { Quiz } from '../../lib/domain/types';

  let { quiz, heading }: { quiz: Quiz; heading: string } = $props();

  const today = new Intl.DateTimeFormat('en-IN', { dateStyle: 'long' }).format(new Date());
  const details = $derived(
    [quiz.level, quiz.subject, quiz.venue, quiz.quizMasters ? `Quiz master ${quiz.quizMasters}` : '', today].filter(
      (part) => part.trim(),
    ),
  );
</script>

<header>
  <h1>{quiz.title}</h1>
  <h2>{heading}</h2>
  <p>{details.join(', ')}</p>
</header>

<style>
  header {
    display: grid;
    gap: var(--space-1);
    margin-block-end: var(--space-4);
    padding-block-end: var(--space-3);
    border-block-end: 2px solid var(--fg);
  }

  h1 {
    font-size: var(--step-3);
  }

  h2 {
    font-size: var(--step-1);
  }

  p {
    color: var(--muted);
  }
</style>
