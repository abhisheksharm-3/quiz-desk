<!-- The question on stage: picture, text, options. The answer, correct option and verdict render only when a result is passed. -->
<script lang="ts">
  import { OPTION_LETTERS } from '../../lib/domain/options';
  import { answerLines, visibleText } from '../../lib/domain/questions';
  import type { Points, Question, Quiz } from '../../lib/domain/types';
  import { pictureSrc } from '../../lib/pictures';
  import ResultBanner from './ResultBanner.svelte';

  let {
    question,
    mode,
    result,
  }: {
    question: Question;
    mode: Quiz['languageMode'];
    result: { correct: boolean; teamName: string | null; points: Points } | null;
  } = $props();

  const text = $derived(visibleText(question, mode));
  const options = $derived(question.options?.map((label, index) => ({ letter: OPTION_LETTERS[index], label })).filter((option) => option.label.trim()) ?? []);

  const answer = $derived(answerLines(question, mode));
</script>

<article class="card">
  {#if question.image}
    <img src={pictureSrc(question.image)} alt="Question illustration" />
  {/if}
  {#if text.en || text.hi}
    <div class="text">
      {#if text.en}<p class="line">{text.en}</p>{/if}
      {#if text.hi}<p class="line" lang="hi">{text.hi}</p>{/if}
    </div>
  {/if}
  {#if options.length}
    <ol class="options">
      {#each options as option (option.letter)}
        <li class:right={result && option.letter === question.correctOption}>
          <span class="letter">{option.letter}</span>
          <span>{option.label}</span>
          {#if result && option.letter === question.correctOption}<span class="sr">, correct answer</span>{/if}
        </li>
      {/each}
    </ol>
  {/if}
  {#if result}
    <ResultBanner correct={result.correct} teamName={result.teamName} points={result.points} {answer} />
  {/if}
</article>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-height: 0;
  }

  img {
    flex: 1 1 0;
    min-height: 0;
    max-width: 100%;
    object-fit: contain;
    object-position: left center;
  }

  .line {
    font-size: var(--step-5);
    font-weight: 600;
    line-height: 1.2;
  }

  .text {
    display: grid;
    gap: var(--space-2);
  }

  .options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-2) var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--step-3);
  }

  .options li {
    display: flex;
    gap: var(--space-3);
    align-items: baseline;
    padding: var(--space-2) var(--space-3);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    overflow-wrap: anywhere;
  }

  .letter {
    color: var(--accent);
    font-weight: 800;
  }

  .options li.right {
    border-color: var(--right);
    color: var(--right);
  }

  .options li.right .letter {
    color: inherit;
  }

  @media (max-width: 40rem) {
    .options {
      grid-template-columns: 1fr;
    }
  }
</style>
