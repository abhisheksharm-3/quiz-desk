<!-- Teams step: add schools with Enter, rename them in place, delete from the row menu, up to the ten a quiz allows. -->
<script lang="ts">
  import Button from '../../components/Button.svelte';
  import Confirm from '../../components/Confirm.svelte';
  import Field from '../../components/Field.svelte';
  import Menu from '../../components/Menu.svelte';
  import { attempt } from '../../lib/attempt';
  import { addTeam, deleteTeam, MAX_TEAMS, renameTeam } from '../../lib/domain/quiz';
  import type { Quiz, Team } from '../../lib/domain/types';
  import { commit } from '../../lib/store.svelte';

  let { quiz }: { quiz: Quiz } = $props();
  let name = $state('');
  let message: string | null = $state(null);
  let pendingDelete: Team | null = $state(null);

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
    message = attempt(() => commit(() => renameTeam(quiz, team.id, trimmed)));
    if (message) input.value = team.name;
  }

  function confirmDelete() {
    if (pendingDelete) {
      const { id } = pendingDelete;
      message = attempt(() => commit(() => deleteTeam(quiz, id)));
    }
    pendingDelete = null;
  }
</script>

<section>
  <form onsubmit={add}>
    <Field label="Add a school">
      <input
        bind:value={name}
        autocomplete="off"
        placeholder="Type a school name, press Enter"
        disabled={quiz.teams.length >= MAX_TEAMS}
      />
    </Field>
    <Button type="submit" disabled={!name.trim() || quiz.teams.length >= MAX_TEAMS}>Add</Button>
  </form>

  {#if message}
    <p class="error" role="alert">{message}</p>
  {/if}

  <div class="list-head">
    <h3>Schools</h3>
    <p class="count">{quiz.teams.length} / {MAX_TEAMS}</p>
  </div>

  {#if quiz.teams.length === 0}
    <p class="empty">No schools yet. Type the first school's name above and press Enter.</p>
  {:else}
    <ol>
      {#each quiz.teams as team, index (team.id)}
        <li>
          <span class="number" aria-hidden="true">{index + 1}</span>
          <input
            aria-label="Name of team {index + 1}"
            value={team.name}
            autocomplete="off"
            onchange={(e) => rename(team, e.currentTarget)}
          />
          <Menu
            label="More actions for {team.name}"
            items={[{ text: 'Delete team', danger: true, run: () => (pendingDelete = team) }]}
          />
        </li>
      {/each}
    </ol>
  {/if}
</section>

<Confirm
  bind:open={() => pendingDelete !== null, (isOpen) => !isOpen && (pendingDelete = null)}
  title="Delete this team?"
  confirmLabel="Delete team"
  keepLabel="Keep team"
  onconfirm={confirmDelete}>
  {pendingDelete?.name} will be removed from the quiz.
</Confirm>

<style>
  section {
    display: grid;
    gap: var(--space-3);
  }

  form {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: var(--space-2);
  }

  .list-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-block-start: var(--space-3);
  }

  .count {
    color: var(--muted);
    font-weight: 600;
  }

  ol {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
    border-block-start: 1px solid var(--line);
  }

  li {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-2);
    padding-block: var(--space-1);
    border-block-end: 1px solid var(--line);
  }

  .number {
    color: var(--muted);
    font-weight: 600;
    text-align: center;
  }

  li input {
    border-color: transparent;
    font-size: var(--step-1);
    font-weight: 600;
  }

  li input:hover {
    border-color: var(--line);
  }

  li input:focus {
    border-color: var(--accent);
  }

  .error {
    color: var(--wrong);
    font-weight: 600;
  }

  .empty {
    color: var(--muted);
  }
</style>
