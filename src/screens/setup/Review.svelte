<!-- Review step: what is still missing with a link to each fix, the answer key, and the rehearsal tools. -->
<script lang="ts">
  import Button from '../../components/Button.svelte';
  import Confirm from '../../components/Confirm.svelte';
  import { clearScores, resetAsked } from '../../lib/domain/quiz';
  import type { ReadyIssue, SetupStep } from '../../lib/domain/ready';
  import type { Quiz } from '../../lib/domain/types';
  import { commit } from '../../lib/store.svelte';
  import { STEP_LABELS } from './steps';

  let {
    quiz,
    issues,
    onstep,
  }: { quiz: Quiz; issues: ReadyIssue[]; onstep: (step: SetupStep) => void } = $props();

  let confirmingReset = $state(false);
  let confirmingClear = $state(false);

  function confirmReset() {
    commit(() => resetAsked(quiz));
    confirmingReset = false;
  }

  function confirmClear() {
    commit(() => clearScores(quiz));
    confirmingClear = false;
  }
</script>

<section>
  {#if issues.length === 0}
    <p class="ok">✓ Ready to run</p>
    <p class="muted">Teams, rounds and questions are all in place.</p>
  {:else}
    <h3>Still to do</h3>
    <ul class="issues">
      {#each issues as issue (issue.text)}
        <li>
          <span>{issue.text}</span>
          <Button type="button" onclick={() => onstep(issue.step)}>
            Fix in {STEP_LABELS[issue.step]} <span class="sr">: {issue.text}</span>
          </Button>
        </li>
      {/each}
    </ul>
  {/if}

  <div class="tools">
    <h3>Answer key</h3>
    <p class="muted">A printed copy of every question and answer, for the quiz master.</p>
    <div><Button type="button" onclick={() => window.print()}>Print answer key</Button></div>
  </div>

  <div class="tools">
    <h3>Rehearsal</h3>
    <p class="muted">Ran a practice round? Reset before the real quiz.</p>
    <div class="buttons">
      <Button type="button" onclick={() => (confirmingReset = true)}>Reset asked questions</Button>
      <Button type="button" onclick={() => (confirmingClear = true)}>Clear all scores</Button>
    </div>
  </div>
</section>

<Confirm
  bind:open={confirmingReset}
  title="Reset asked questions?"
  confirmLabel="Reset asked questions"
  keepLabel="Keep as is"
  onconfirm={confirmReset}>
  Every question in this quiz becomes available again. Use this to rehearse. Scores are kept.
</Confirm>

<Confirm
  bind:open={confirmingClear}
  title="Clear all scores?"
  confirmLabel="Clear all scores"
  keepLabel="Keep scores"
  onconfirm={confirmClear}>
  Every team goes back to 0 in every round. Use this after a rehearsal, before the real quiz. This cannot be undone.
</Confirm>

<style>
  section {
    display: grid;
    gap: var(--space-4);
  }

  .ok {
    color: var(--right);
    font-size: var(--step-3);
    font-weight: 800;
  }

  .muted {
    color: var(--muted);
  }

  .issues {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
    border-block-start: 1px solid var(--line);
  }

  .issues li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding-block: var(--space-2);
    border-block-end: 1px solid var(--line);
  }

  .tools {
    display: grid;
    justify-items: start;
    gap: var(--space-2);
    padding-block-start: var(--space-4);
    border-block-start: 1px solid var(--line);
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
</style>
