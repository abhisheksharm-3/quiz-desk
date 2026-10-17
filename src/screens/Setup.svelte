<!-- Setup: five guided steps for one quiz, a step rail on the left and one "Next" button that always leads on. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import Button from '../components/Button.svelte';
  import { readyIssues, type SetupStep } from '../lib/domain/ready';
  import { go } from '../lib/nav.svelte';
  import { quizById } from '../lib/store.svelte';
  import AnswerKey from './print/AnswerKey.svelte';
  import Details from './setup/Details.svelte';
  import Questions from './setup/Questions.svelte';
  import Review from './setup/Review.svelte';
  import Rounds from './setup/Rounds.svelte';
  import { STEPS } from './setup/steps';
  import Teams from './setup/Teams.svelte';

  let { quizId, step = 'details' }: { quizId: string; step?: SetupStep } = $props();
  let activeId: SetupStep = $state(untrack(() => step));
  let selectedRoundId: string | null = $state(null);

  const quiz = $derived(quizById(quizId));
  const issues = $derived(readyIssues(quiz));
  const activeIndex = $derived(STEPS.findIndex((candidate) => candidate.id === activeId));
  const active = $derived(STEPS[activeIndex]);
  const following = $derived(STEPS[activeIndex + 1] ?? null);
  const ready = $derived(issues.length === 0);

  const nextIsPrimary = $derived.by(() => {
    if (activeId === 'teams') return quiz.teams.length > 0;
    if (activeId === 'rounds') return quiz.rounds.length > 0;
    if (activeId === 'questions') return !issues.some((issue) => issue.roundId === (selectedRound()?.id ?? ''));
    return true;
  });

  function selectedRound() {
    return quiz.rounds.find((round) => round.id === selectedRoundId) ?? quiz.rounds[0];
  }

  function issuesIn(id: SetupStep) {
    return issues.filter((issue) => issue.step === id).length;
  }

  function isDone(id: SetupStep) {
    if (id === 'review') return ready;
    if (id === 'questions') return quiz.rounds.length > 0 && issuesIn(id) === 0;
    return issuesIn(id) === 0;
  }

  function startQuiz() {
    go({ screen: 'live', quizId, roundId: null });
  }
</script>

<main class="screen-only">
  <header>
    <Button type="button" onclick={() => go({ screen: 'home' })}>Back to quizzes</Button>
    <h1>{quiz.title}</h1>
  </header>

  <div class="layout">
    <nav aria-label="Setup steps">
      <ol>
        {#each STEPS as candidate, index (candidate.id)}
          {@const left = issuesIn(candidate.id)}
          <li>
            <button
              type="button"
              aria-current={activeId === candidate.id ? 'step' : undefined}
              onclick={() => (activeId = candidate.id)}
            >
              <span class="marker" class:done={isDone(candidate.id)}>
                {#if isDone(candidate.id)}✓<span class="sr"> done</span>{:else}{index + 1}{/if}
              </span>
              <span class="label">{candidate.label}</span>
              {#if left > 0 && candidate.id !== 'review'}
                <span class="left">{left} to fix</span>
              {/if}
            </button>
          </li>
        {/each}
      </ol>
    </nav>

    <section aria-labelledby="step-title">
      <div class="intro">
        <h2 id="step-title">{active.label}</h2>
        <p>{active.hint}</p>
      </div>

      <div class="content">
        {#if activeId === 'details'}
          <Details {quiz} />
        {:else if activeId === 'teams'}
          <Teams {quiz} />
        {:else if activeId === 'rounds'}
          <Rounds {quiz} />
        {:else if activeId === 'questions'}
          <Questions {quiz} bind:selectedId={selectedRoundId} {issues} onstep={(id) => (activeId = id)} />
        {:else}
          <Review {quiz} {issues} onstep={(id) => (activeId = id)} />
        {/if}
      </div>

      <footer>
        {#if following}
          <Button
            type="button"
            variant={nextIsPrimary ? 'primary' : 'quiet'}
            onclick={() => (activeId = following.id)}
          >
            Next: {following.label} →
          </Button>
        {:else}
          {#if !ready}
            <p id="start-hint">Fix the items above to start the quiz.</p>
          {/if}
          <Button
            type="button"
            variant="primary"
            size="large"
            disabled={!ready}
            aria-describedby={ready ? undefined : 'start-hint'}
            onclick={startQuiz}
          >
            Start quiz
          </Button>
        {/if}
      </footer>
    </section>
  </div>
</main>

<AnswerKey {quiz} />

<style>
  main {
    max-width: 72rem;
    margin: 0 auto;
    padding: var(--space-5) var(--space-4) 0;
  }

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3) var(--space-4);
    margin-block-end: var(--space-5);
  }

  h1 {
    color: var(--accent);
    font-size: var(--step-3);
  }

  .layout {
    display: grid;
    grid-template-columns: 14rem minmax(0, 1fr);
    gap: var(--space-5);
    align-items: start;
  }

  nav {
    position: sticky;
    top: var(--space-4);
  }

  nav ol {
    display: grid;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  nav button {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr);
    column-gap: var(--space-3);
    align-items: center;
    width: 100%;
    min-height: var(--control);
    padding: var(--space-2) var(--space-3);
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: var(--muted);
    font: inherit;
    font-weight: 600;
    text-align: start;
    cursor: pointer;
  }

  nav button:hover {
    color: var(--fg);
  }

  nav button[aria-current='step'] {
    background: var(--surface);
    color: var(--fg);
  }

  .marker {
    display: grid;
    place-items: center;
    width: 2rem;
    aspect-ratio: 1;
    border: 2px solid var(--line);
    border-radius: var(--radius-pill);
    font-size: var(--step--1);
    font-weight: 800;
  }

  .marker.done {
    border-color: var(--right);
    color: var(--right);
  }

  [aria-current='step'] .marker {
    border-color: var(--accent);
    background: var(--accent-bg);
    color: var(--accent-fg);
  }

  .left {
    grid-column: 2;
    color: var(--muted);
    font-size: var(--step--1);
    font-weight: 400;
  }

  section {
    display: grid;
    gap: var(--space-4);
    min-width: 0;
    max-width: 48rem;
  }

  .intro {
    display: grid;
    gap: var(--space-1);
  }

  .intro h2 {
    font-size: var(--step-3);
    font-weight: 800;
  }

  .intro p {
    max-width: 60ch;
    color: var(--muted);
    font-size: var(--step-1);
  }

  footer {
    position: sticky;
    bottom: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-3);
    margin-block-start: var(--space-3);
    padding-block: var(--space-3) var(--space-4);
    border-block-start: 1px solid var(--line);
    background: var(--bg);
  }

  footer p {
    color: var(--muted);
  }

  @media (max-width: 52rem) {
    .layout {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-4);
    }

    nav {
      position: static;
      overflow-x: auto;
    }

    nav ol {
      grid-auto-flow: column;
      grid-auto-columns: max-content;
    }
  }
</style>
