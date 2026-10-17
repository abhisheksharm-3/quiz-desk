<!-- Teams tab: add, rename and delete teams, up to the ten a quiz allows. -->
<script lang="ts">
  import Button from '../../components/Button.svelte';
  import Field from '../../components/Field.svelte';
  import { attempt } from '../../lib/attempt';
  import { addTeam, deleteTeam, MAX_TEAMS, renameTeam } from '../../lib/domain/quiz';
  import type { Quiz, Team } from '../../lib/domain/types';
  import { commit } from '../../lib/store.svelte';

  let { quiz }: { quiz: Quiz } = $props();
  let name = $state('');
  let message: string | null = $state(null);

  function add(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    message = attempt(() => commit(() => addTeam(quiz, trimmed)));
    if (!message) name = '';
  }

  function rename(team: Team, input: HTMLInputElement) {
    const trimmed = input.value.trim();
    if (!trimmed) {
      input.value = team.name;
      return;
    }
    commit(() => renameTeam(quiz, team.id, trimmed));
  }

  function remove(team: Team) {
    message = attempt(() => commit(() => deleteTeam(quiz, team.id)));
  }
</script>

<section>
  <div class="head">
    <h2>Teams</h2>
    <p class="count">{quiz.teams.length} / {MAX_TEAMS}</p>
  </div>

  <form onsubmit={add}>
    <Field label="Team name">
      <input bind:value={name} autocomplete="off" />
    </Field>
    <Button type="submit" variant="primary" disabled={!name.trim() || quiz.teams.length >= MAX_TEAMS}>
      Add team
    </Button>
  </form>

  {#if message}
    <p class="error" role="alert">{message}</p>
  {/if}

  {#if quiz.teams.length === 0}
    <p class="empty">No teams yet. Add the competing schools, at least 2 and at most {MAX_TEAMS}.</p>
  {:else}
    <ul>
      {#each quiz.teams as team, index (team.id)}
        <li>
          <input
            aria-label="Name of team {index + 1}"
            value={team.name}
            autocomplete="off"
            onchange={(e) => rename(team, e.currentTarget)}
          />
          <Button type="button" onclick={() => remove(team)}>
            Delete <span class="sr">{team.name}</span>
          </Button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  section {
    display: grid;
    gap: var(--space-3);
    max-width: 38rem;
  }

  .head {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
  }

  .count {
    color: var(--muted);
    font-weight: 600;
  }

  form,
  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-2);
  }

  form {
    align-items: end;
  }

  li {
    align-items: center;
  }

  ul {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .error {
    color: var(--wrong);
    font-weight: 600;
  }

  .empty {
    color: var(--muted);
  }
</style>
