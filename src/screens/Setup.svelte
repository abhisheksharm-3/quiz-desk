<!-- Setup: the tabbed workspace for one quiz: details, teams, rounds with questions, and the ready check. -->
<script lang="ts">
  import Button from '../components/Button.svelte';
  import Dialog from '../components/Dialog.svelte';
  import { resetAsked } from '../lib/domain/quiz';
  import { readyCheck } from '../lib/domain/ready';
  import { go } from '../lib/nav.svelte';
  import { commit, quizById } from '../lib/store.svelte';
  import AnswerKey from './print/AnswerKey.svelte';
  import Details from './setup/Details.svelte';
  import Rounds from './setup/Rounds.svelte';
  import Teams from './setup/Teams.svelte';

  const TABS = [
    { id: 'details', label: 'Details' },
    { id: 'teams', label: 'Teams' },
    { id: 'rounds', label: 'Rounds & questions' },
    { id: 'ready', label: 'Ready' },
  ] as const;

  let { quizId }: { quizId: string } = $props();
  let active: (typeof TABS)[number]['id'] = $state('details');
  let confirmingReset = $state(false);
  let tabButtons: HTMLButtonElement[] = $state([]);

  const quiz = $derived(quizById(quizId));
  const problems = $derived(readyCheck(quiz));

  function moveTab(event: KeyboardEvent, index: number) {
    const last = TABS.length - 1;
    const target =
      event.key === 'ArrowRight' ? (index + 1) % TABS.length
      : event.key === 'ArrowLeft' ? (index + last) % TABS.length
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null;
    if (target === null) return;
    event.preventDefault();
    active = TABS[target].id;
    tabButtons[target].focus();
  }

  function confirmReset() {
    commit(() => resetAsked(quiz));
    confirmingReset = false;
  }
</script>

<main class="screen-only">
  <header>
    <Button type="button" onclick={() => go({ screen: 'home' })}>Back to quizzes</Button>
    <h1>{quiz.title}</h1>
    <Button type="button" onclick={() => window.print()}>Print answer key</Button>
  </header>

  <div role="tablist" aria-label="Quiz setup">
    {#each TABS as tab, index (tab.id)}
      <button
        type="button"
        role="tab"
        id="tab-{tab.id}"
        aria-selected={active === tab.id}
        aria-controls="panel-{tab.id}"
        tabindex={active === tab.id ? 0 : -1}
        bind:this={tabButtons[index]}
        onclick={() => (active = tab.id)}
        onkeydown={(event) => moveTab(event, index)}
      >
        {tab.label}
        {#if tab.id === 'ready' && problems.length > 0}
          <span class="badge">{problems.length}<span class="sr"> to fix</span></span>
        {/if}
      </button>
    {/each}
  </div>

  <div role="tabpanel" id="panel-{active}" aria-labelledby="tab-{active}" tabindex="-1">
    {#if active === 'details'}
      <Details {quiz} />
    {:else if active === 'teams'}
      <Teams {quiz} />
    {:else if active === 'rounds'}
      <Rounds {quiz} />
    {:else}
      <section class="ready">
        <h2>Ready check</h2>
        {#if problems.length === 0}
          <p class="ok">Ready to start</p>
        {:else}
          <ul>
            {#each problems as problem (problem)}
              <li>{problem}</li>
            {/each}
          </ul>
        {/if}
        <div>
          <Button type="button" onclick={() => (confirmingReset = true)}>Reset asked questions</Button>
        </div>
      </section>
    {/if}
  </div>
</main>

<AnswerKey {quiz} />

<Dialog bind:open={confirmingReset} title="Reset asked questions?">
  <p>Every question in this quiz becomes available again. Use this to rehearse. Scores are kept.</p>
  <div class="buttons">
    <Button type="button" onclick={() => (confirmingReset = false)}>Keep as is</Button>
    <Button type="button" variant="danger" onclick={confirmReset}>Reset asked questions</Button>
  </div>
</Dialog>

<style>
  main {
    max-width: 72rem;
    margin: 0 auto;
    padding: var(--space-5) var(--space-4) var(--space-6);
  }

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3) var(--space-4);
    margin-block-end: var(--space-4);
  }

  h1 {
    color: var(--accent);
    font-size: var(--step-3);
  }

  [role='tablist'] {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    margin-block-end: var(--space-4);
    border-block-end: 1px solid var(--line);
  }

  [role='tab'] {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 2.75rem;
    padding: var(--space-2) var(--space-3);
    border: 0;
    border-block-end: 3px solid transparent;
    background: transparent;
    color: var(--muted);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  [role='tab'][aria-selected='true'] {
    border-block-end-color: var(--accent);
    color: var(--fg);
  }

  .badge {
    min-width: 1.5rem;
    padding: 0 var(--space-2);
    border-radius: var(--radius-pill);
    background: var(--wrong);
    color: var(--bg);
    font-size: var(--step--1);
    text-align: center;
  }

  .ready {
    display: grid;
    gap: var(--space-3);
    max-width: 44rem;
  }

  .ready ul {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding-inline-start: var(--space-4);
  }

  .ok {
    color: var(--right);
    font-size: var(--step-2);
    font-weight: 800;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-2);
  }
</style>
