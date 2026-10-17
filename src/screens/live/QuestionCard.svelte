<!-- The question on stage: picture, text, options. The answer, correct option and verdict render only when a result is passed. Text shrinks until everything fits. -->
<script lang="ts">
  import { fitContent } from '../../lib/fit';
  import { OPTION_LETTERS } from '../../lib/domain/options';
  import { answerLines, visibleText } from '../../lib/domain/questions';
  import type { Points, Question, Quiz } from '../../lib/domain/types';
  import { pictureSrc } from '../../lib/pictures';
  import ResultBanner from './ResultBanner.svelte';

  const LONG_OPTION_LENGTH = 38;

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
  const hasLongOption = $derived(options.some((option) => option.label.length > LONG_OPTION_LENGTH));

  const answer = $derived(answerLines(question, mode));
</script>

<article class="card" {@attach fitContent}>
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
    <ol class="options" class:single={hasLongOption}>
      {#each options as option (option.letter)}
        <li class:right={result && option.letter === question.correctOption}>
          <span class="letter">{option.letter}</span>
          <span class="label">{option.label}</span>
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
    justify-content: center;
    gap: calc(var(--space-4) * var(--fit, 1));
    min-height: 0;
    overflow-y: auto;
  }

  img {
    flex: 1 1 0;
    min-height: 0;
    max-width: 100%;
    object-fit: contain;
    object-position: left center;
  }

  .line {
    font-size: calc(var(--step-5) * var(--fit, 1));
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: -0.015em;
    text-wrap: balance;
  }

  .line:lang(hi) {
    line-height: 1.5;
    letter-spacing: 0;
  }

  .text {
    display: grid;
    gap: calc(var(--space-2) * var(--fit, 1));
  }

  .options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: calc(var(--space-3) * var(--fit, 1));
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: calc(var(--step-3) * var(--fit, 1));
  }

  .options.single {
    grid-template-columns: minmax(0, 1fr);
  }

  .options li {
    display: flex;
    gap: 0.5em;
    align-items: baseline;
    padding: 0.3em 0.6em;
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .letter {
    flex: none;
    min-width: 1.2em;
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
