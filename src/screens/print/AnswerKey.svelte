<!-- Printable answer key: every round's questions with their answers, in the order they are asked. -->
<script lang="ts">
  import { answerLines, visibleText } from '../../lib/domain/questions';
  import type { Quiz } from '../../lib/domain/types';
  import PrintHeading from './PrintHeading.svelte';

  let { quiz }: { quiz: Quiz } = $props();
</script>

<section class="print-only">
  <PrintHeading {quiz} heading="Answer key" />
  {#each quiz.rounds as round (round.id)}
    <section class="round">
      <h3>{round.name}</h3>
      {#if round.questions.length === 0}
        <p>No questions in this round.</p>
      {:else}
        <ol>
          {#each round.questions as question (question.id)}
            {@const text = visibleText(question, 'both')}
            {@const answer = answerLines(question, 'both')}
            <li>
              <div>
                {#if text.en}<p>{text.en}</p>{/if}
                {#if text.hi}<p lang="hi">{text.hi}</p>{/if}
                {#if !text.en && !text.hi}<p>Picture question</p>{/if}
              </div>
              <div class="answer">
                {#if answer.en}<p>{answer.en}</p>{/if}
                {#if answer.hi}<p lang="hi">{answer.hi}</p>{/if}
                {#if !answer.en && !answer.hi}<p>No answer entered</p>{/if}
              </div>
            </li>
          {/each}
        </ol>
      {/if}
    </section>
  {/each}
</section>

<style>
  .round {
    margin-block-end: var(--space-4);
  }

  h3 {
    margin-block-end: var(--space-2);
    font-size: var(--step-1);
  }

  ol {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding-inline-start: var(--space-4);
  }

  li {
    break-inside: avoid;
    padding-block-end: var(--space-2);
    border-block-end: 1px solid var(--line);
  }

  li::marker {
    font-weight: 600;
  }

  .answer {
    font-weight: 800;
  }
</style>
