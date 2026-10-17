<!-- Scores: the projector score sheet, teams ranked best first with their points per round and total, live from the quiz data. -->
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
  const standings = $derived(
    quiz.teams
      .map((team, index) => ({
        team,
        byRound: sheet.rows.map((row) => row.byTeam[index]),
        total: sheet.totals[index],
        rank: sheet.ranks[index],
      }))
      .sort((a, b) => a.rank - b.rank),
  );

  const toBoard = () => go({ screen: 'live', quizId, roundId: null });
</script>

<main class="screen-only">
  <header>
    <div class="heading">
      <p class="quiz">{quiz.title}</p>
      <h1>Scores</h1>
    </div>
    <div class="tools">
      <Button type="button" onclick={() => window.print()}>Print result sheet</Button>
      <Button type="button" variant="primary" onclick={toBoard}>Back to rounds</Button>
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
        <caption class="sr">Scores by team and round, best first</caption>
        <thead>
          <tr>
            <th scope="col">Rank</th>
            <th scope="col" class="team">Team</th>
            {#each sheet.rows as row (row.round.id)}
              <th scope="col" class="num">{row.round.name}</th>
            {/each}
            <th scope="col" class="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {#each standings as standing (standing.team.id)}
            {@const leader = anyScore && standing.rank === 1}
            <tr class:leader>
              <td><span class="rank">{standing.rank}</span></td>
              <th scope="row" class="team">{standing.team.name}</th>
              {#each standing.byRound as points, index (sheet.rows[index].round.id)}
                <td class="num" class:minus={points < 0}>{points}</td>
              {/each}
              <td class="num total" class:minus={standing.total < 0}>{standing.total}</td>
            </tr>
          {/each}
        </tbody>
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
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .quiz {
    color: var(--muted);
    font-size: var(--step-1);
    font-weight: 600;
  }

  h1 {
    color: var(--accent);
    font-size: var(--step-4);
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
    font-size: var(--step-2);
  }

  th,
  td {
    padding: var(--space-2) var(--space-3);
    border-block-end: 1px solid var(--line);
  }

  thead th {
    color: var(--muted);
    font-size: var(--step-0);
    font-weight: 600;
    text-align: start;
    vertical-align: bottom;
  }

  .team {
    width: 100%;
    min-width: 12rem;
    font-weight: 600;
    text-align: start;
    overflow-wrap: anywhere;
  }

  .num {
    text-align: end;
    font-variant-numeric: tabular-nums;
  }

  thead .num {
    min-width: 6rem;
  }

  .total {
    font-size: var(--step-4);
    font-weight: 800;
    line-height: 1;
  }

  .minus {
    color: var(--wrong);
  }

  tr.leader .team,
  tr.leader .total {
    color: var(--accent);
  }

  .rank {
    display: inline-grid;
    place-items: center;
    min-width: 2.25em;
    padding: 0 var(--space-2);
    border: 2px solid var(--line);
    border-radius: var(--radius-pill);
    font-size: var(--step-1);
    font-weight: 800;
  }

  tr.leader .rank {
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
