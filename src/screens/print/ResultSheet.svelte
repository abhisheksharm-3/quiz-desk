<!-- Printable result sheet: the round by team grid with totals and ranks. -->
<script lang="ts">
  import type { Quiz } from '../../lib/domain/types';
  import { buildSheet } from '../../lib/domain/scoresheet';
  import PrintHeading from './PrintHeading.svelte';

  let { quiz }: { quiz: Quiz } = $props();

  const sheet = $derived(buildSheet(quiz));
</script>

<section class="print-only">
  <PrintHeading {quiz} heading="Result sheet" />
  <table>
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
            <td>{points}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
    <tfoot>
      <tr>
        <th scope="row">Total</th>
        {#each sheet.totals as total, index (quiz.teams[index].id)}
          <td>{total}</td>
        {/each}
      </tr>
      <tr>
        <th scope="row">Rank</th>
        {#each sheet.ranks as rank, index (quiz.teams[index].id)}
          <td>{rank}</td>
        {/each}
      </tr>
    </tfoot>
  </table>
</section>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--step-0);
  }

  th,
  td {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--line);
    text-align: center;
  }

  th[scope='row'] {
    text-align: start;
  }

  tfoot th,
  tfoot td {
    font-weight: 800;
    border-block-start: 2px solid var(--fg);
  }
</style>
