<!-- Scores: the projector score sheet, rounds by teams with totals and ranks, live from the quiz data. -->
<script lang="ts">
  import Button from '../components/Button.svelte';
  import { buildSheet } from '../lib/domain/scoresheet';
  import { go } from '../lib/nav.svelte';
  import { quizById } from '../lib/store.svelte';
  import ResultSheet from './print/ResultSheet.svelte';

  let { quizId }: { quizId: string } = $props();

  const quiz = $derived(quizById(quizId));
  const sheet = $derived(buildSheet(quiz));
  const anyScore = $derived(quiz.scores.length > 0);

  const toBoard = () => go({ screen: 'live', quizId, roundId: null });
</script>

<main class="screen-only">
  <header>
    <h1>{quiz.title}</h1>
    <div class="tools">
      <Button type="button" onclick={toBoard}>Back to rounds</Button>
      <Button type="button" onclick={() => window.print()}>Print result sheet</Button>
    </div>
  </header>

  {#if quiz.teams.length === 0}
    <section class="empty">
      <h2>This quiz has no teams</h2>
      <p>Add the teams in setup to see their scores here.</p>
    </section>
  {:else}
    <div class="scroll">
      <table>
        <caption class="sr">Scores by round and team</caption>
        <thead>
          <tr>
            <td></td>
            {#each quiz.teams as team (team.id)}
              <th scope="col">{team.name}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each sheet.rows as row (row.round.id)}
            <tr>
              <th scope="row">{row.round.name}</th>
              {#each row.byTeam as points, index (quiz.teams[index].id)}
                <td class:minus={points < 0}>{points}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
        <tfoot>
          <tr class="total">
            <th scope="row">Total</th>
            {#each sheet.totals as total, index (quiz.teams[index].id)}
              <td class:leader={anyScore && sheet.ranks[index] === 1} class:minus={total < 0}>{total}</td>
            {/each}
          </tr>
          <tr>
            <th scope="row">Rank</th>
            {#each sheet.ranks as rank, index (quiz.teams[index].id)}
              <td><span class="rank" class:leader={anyScore && rank === 1}>{rank}</span></td>
            {/each}
          </tr>
        </tfoot>
      </table>
    </div>
    {#if !anyScore}
      <p class="hint">No points yet. Scores appear here as teams answer.</p>
    {/if}
  {/if}
</main>

<ResultSheet {quiz} />

<style>
  main {
    display: grid;
    gap: var(--space-5);
    padding: var(--safe-y) var(--safe-x);
  }

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .tools {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .scroll {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--step-3);
  }

  th,
  td {
    padding: var(--space-3);
    border-block-end: 1px solid var(--line);
    text-align: center;
  }

  thead th {
    min-width: 6rem;
    font-size: var(--step-1);
    font-weight: 600;
    color: var(--muted);
  }

  th[scope='row'] {
    font-size: var(--step-1);
    font-weight: 600;
    text-align: start;
    overflow-wrap: anywhere;
  }

  .total th,
  .total td {
    border-block-start: 3px solid var(--fg);
    font-size: var(--step-5);
    font-weight: 800;
  }

  .minus {
    color: var(--wrong);
  }

  td.leader {
    color: var(--accent);
  }

  .rank {
    display: inline-block;
    min-width: 2.5em;
    padding: 0 var(--space-3);
    border: 2px solid var(--line);
    border-radius: var(--radius-pill);
    font-size: var(--step-2);
    font-weight: 800;
  }

  .rank.leader {
    border-color: var(--accent);
    background: var(--accent-bg);
    color: var(--accent-fg);
  }

  .hint,
  .empty p {
    color: var(--muted);
    font-size: var(--step-1);
  }

  .empty {
    display: grid;
    gap: var(--space-2);
  }
</style>
