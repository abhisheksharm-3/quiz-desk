<!-- App shell: loads saved data once, applies the theme, and shows the current screen. -->
<script lang="ts">
  import Button from './components/Button.svelte';
  import Home from './screens/Home.svelte';
  import Live from './screens/Live.svelte';
  import Scores from './screens/Scores.svelte';
  import Setup from './screens/Setup.svelte';
  import { nav } from './lib/nav.svelte';
  import { app, initStore, saveStatus } from './lib/store.svelte';

  let loading: Promise<void> = $state(initStore());

  $effect(() => {
    document.documentElement.dataset.theme = app.theme;
  });
</script>

{#await loading}
  <main class="state" aria-busy="true">
    <h1>Quiz Desk</h1>
    <div class="skeleton" aria-hidden="true"></div>
  </main>
{:then}
  {#if saveStatus.failed}
    <p class="banner" role="alert">
      Your last change could not be saved. Check that the disk has space, then keep working: the next
      change tries again.
    </p>
  {/if}
  {#if nav.screen === 'home'}
    <Home />
  {:else if nav.screen === 'setup'}
    <Setup quizId={nav.quizId} step={nav.step} />
  {:else if nav.screen === 'live'}
    <Live quizId={nav.quizId} roundId={nav.roundId} />
  {:else}
    <Scores quizId={nav.quizId} />
  {/if}
{:catch}
  <main class="state" role="alert">
    <h1>Saved quizzes could not be read</h1>
    <p>
      The data file is damaged. Nothing was changed and nothing will be saved until it loads. Close
      other copies of Quiz Desk and try again, or restore the file from a backup.
    </p>
    <Button type="button" variant="primary" onclick={() => (loading = initStore())}>Try again</Button>
  </main>
{/await}

<style>
  .state {
    display: grid;
    justify-items: start;
    gap: var(--space-3);
    max-width: 44rem;
    margin: 0 auto;
    padding: var(--space-6) var(--space-4);
  }

  .skeleton {
    width: 100%;
    height: 12rem;
    border-block: 1px solid var(--line);
  }

  .banner {
    margin: 0;
    padding: var(--space-3) var(--space-4);
    background: var(--wrong);
    color: var(--bg);
    font-weight: 600;
  }
</style>
