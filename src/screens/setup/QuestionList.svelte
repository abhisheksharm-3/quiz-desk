<!-- Question list: one row per question with its number, text in the quiz's language, an asked badge, edit and delete. -->
<script lang="ts">
  import Button from '../../components/Button.svelte';
  import type { Question, Quiz, Round } from '../../lib/domain/types';
  import { pictureSrc } from '../../lib/pictures';

  let {
    round,
    languageMode,
    onedit,
    ondelete,
  }: {
    round: Round;
    languageMode: Quiz['languageMode'];
    onedit: (question: Question) => void;
    ondelete: (question: Question) => void;
  } = $props();

  const noun = $derived(round.type === 'picture' ? 'picture' : 'question');

  function lines(question: Question): { text: string; lang?: string }[] {
    const english = { text: question.en };
    const hindi = { text: question.hi, lang: 'hi' };
    const filled = (languageMode === 'hi' ? [hindi, english] : [english, hindi]).filter((line) => line.text);
    return languageMode === 'both' ? filled : filled.slice(0, 1);
  }
</script>

{#if round.questions.length === 0}
  <p class="empty">
    No {noun}s in this round yet. Add the first one below.
  </p>
{:else}
  <ol>
    {#each round.questions as question, index (question.id)}
      <li>
        <span class="number">{index + 1}</span>
        <div class="body">
          {#if question.image}
            <img src={pictureSrc(question.image)} alt="Picture {index + 1}" />
          {/if}
          {#each lines(question) as line (line.lang ?? 'en')}
            <p lang={line.lang}>{line.text}</p>
          {/each}
          {#if question.askedAt !== null}
            <span class="asked">Asked</span>
          {/if}
        </div>
        <div class="actions">
          <Button type="button" onclick={() => onedit(question)}>
            Edit <span class="sr">{noun} {index + 1}</span>
          </Button>
          <Button type="button" onclick={() => ondelete(question)}>
            Delete <span class="sr">{noun} {index + 1}</span>
          </Button>
        </div>
      </li>
    {/each}
  </ol>
{/if}

<style>
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
    border-block-start: 1px solid var(--line);
  }

  li {
    display: grid;
    grid-template-columns: 2.5rem minmax(0, 1fr) auto;
    align-items: start;
    gap: var(--space-3);
    padding-block: var(--space-3);
    border-block-end: 1px solid var(--line);
  }

  .number {
    color: var(--muted);
    font-weight: 600;
  }

  .body {
    display: grid;
    justify-items: start;
    gap: var(--space-1);
    min-width: 0;
  }

  img {
    max-width: 8rem;
    max-height: 6rem;
    border-radius: var(--radius);
  }

  .asked {
    padding: 0 var(--space-2);
    border: 1px solid var(--line);
    border-radius: var(--radius-pill);
    color: var(--muted);
    font-size: var(--step--1);
    font-weight: 600;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .empty {
    color: var(--muted);
  }
</style>
