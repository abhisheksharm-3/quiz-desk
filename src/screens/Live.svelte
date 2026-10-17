<!-- Live: the round board, and the stage of the opened round. -->
<script lang="ts">
  import Button from '../components/Button.svelte';
  import { go } from '../lib/nav.svelte';
  import { quizById } from '../lib/store.svelte';
  import BuzzerStage from './live/BuzzerStage.svelte';
  import RapidStage from './live/RapidStage.svelte';
  import RoundBoard from './live/RoundBoard.svelte';
  import StandardStage from './live/StandardStage.svelte';

  let { quizId, roundId }: { quizId: string; roundId: string | null } = $props();

  const quiz = $derived(quizById(quizId));
  const round = $derived(quiz.rounds.find((candidate) => candidate.id === roundId) ?? null);

  const toBoard = () => go({ screen: 'live', quizId, roundId: null });
  const toHome = () => go({ screen: 'home' });
</script>

{#if quiz.teams.length === 0}
  <main class="notice">
    <h1>This quiz has no teams</h1>
    <p>Add the teams in setup, then run the quiz.</p>
    <Button type="button" variant="primary" onclick={() => go({ screen: 'setup', quizId })}>Open setup</Button>
  </main>
{:else if !round}
  <RoundBoard {quiz} onopen={(id) => go({ screen: 'live', quizId, roundId: id })} onscores={() => go({ screen: 'scores', quizId })} onback={toHome} />
{:else if round.type === 'standard' || round.type === 'picture'}
  {#key round.id}
    <StandardStage {quiz} {round} onback={toBoard} />
  {/key}
{:else if round.type === 'buzzer'}
  {#key round.id}
    <BuzzerStage {quiz} {round} onback={toBoard} />
  {/key}
{:else}
  {#key round.id}
    <RapidStage {quiz} {round} onback={toBoard} />
  {/key}
{/if}

<style>
  .notice {
    display: grid;
    gap: var(--space-3);
    justify-items: start;
    max-width: 44rem;
    margin: 0 auto;
    padding: var(--safe-y) var(--safe-x);
  }
</style>
