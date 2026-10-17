<!-- Rounds step: one card per round, edited in place; reorder with the arrows, delete from the card menu. -->
<script lang="ts">
  import { tick } from 'svelte';
  import Button from '../../components/Button.svelte';
  import Confirm from '../../components/Confirm.svelte';
  import Field from '../../components/Field.svelte';
  import IconButton from '../../components/IconButton.svelte';
  import Menu from '../../components/Menu.svelte';
  import { attempt } from '../../lib/attempt';
  import {
    addRound,
    deleteRound,
    MAX_ROUNDS,
    MAX_TIMER_SECONDS,
    moveRound,
    RAPID_TIMER_SECONDS,
    updateRound,
  } from '../../lib/domain/quiz';
  import { ROUND_TYPE_LABELS } from '../../lib/domain/questions';
  import type { Quiz, Round, RoundType } from '../../lib/domain/types';
  import { commit } from '../../lib/store.svelte';

  let { quiz }: { quiz: Quiz } = $props();
  let pendingDelete: Round | null = $state(null);
  let message: string | null = $state(null);
  let nameFields: HTMLInputElement[] = $state([]);

  function countLabel(round: Round) {
    const count = round.questions.length;
    const noun = round.type === 'picture' ? 'picture' : 'question';
    return `${count} ${noun}${count === 1 ? '' : 's'}`;
  }

  function freeName() {
    const taken = new Set(quiz.rounds.map((round) => round.name.trim().toLowerCase()));
    let number = quiz.rounds.length + 1;
    while (taken.has(`round ${number}`)) number++;
    return `Round ${number}`;
  }

  async function add() {
    message = attempt(() => commit(() => addRound(quiz, freeName(), 'standard')));
    if (message) return;
    await tick();
    nameFields.at(-1)?.select();
  }

  function rename(round: Round, input: HTMLInputElement) {
    const name = input.value.trim();
    if (!name) {
      input.value = round.name;
      return;
    }
    message = attempt(() => commit(() => updateRound(quiz, round.id, { name })));
    if (message) input.value = round.name;
  }

  function retype(round: Round, type: RoundType) {
    message = attempt(() => commit(() => updateRound(quiz, round.id, { type })));
  }

  function retime(round: Round, input: HTMLInputElement) {
    message = attempt(() => commit(() => updateRound(quiz, round.id, { timerSeconds: input.valueAsNumber })));
    if (message) input.value = String(round.timerSeconds);
  }

  function confirmDelete() {
    if (pendingDelete) {
      const { id } = pendingDelete;
      commit(() => deleteRound(quiz, id));
    }
    pendingDelete = null;
  }
</script>

<section>
  <div class="list-head">
    <p class="count">{quiz.rounds.length} / {MAX_ROUNDS} rounds</p>
    <Button
      type="button"
      variant={quiz.rounds.length === 0 ? 'primary' : 'quiet'}
      disabled={quiz.rounds.length >= MAX_ROUNDS}
      onclick={add}
    >
      + Add round
    </Button>
  </div>

  {#if message}
    <p class="error" role="alert">{message}</p>
  {/if}

  {#if quiz.rounds.length === 0}
    <p class="empty">No rounds yet. Add the first one, then name it and pick its type.</p>
  {:else}
    <ol>
      {#each quiz.rounds as round, index (round.id)}
        <li>
          <div class="top">
            <span class="number" aria-hidden="true">{index + 1}</span>
            <input
              class="name"
              aria-label="Name of round {index + 1}"
              bind:this={nameFields[index]}
              value={round.name}
              autocomplete="off"
              onchange={(e) => rename(round, e.currentTarget)}
            />
            <IconButton
              icon="up"
              label="Move {round.name} up"
              disabled={index === 0}
              onclick={() => commit(() => moveRound(quiz, round.id, -1))}
            />
            <IconButton
              icon="down"
              label="Move {round.name} down"
              disabled={index === quiz.rounds.length - 1}
              onclick={() => commit(() => moveRound(quiz, round.id, 1))}
            />
            <Menu
              label="More actions for {round.name}"
              items={[{ text: 'Delete round', danger: true, run: () => (pendingDelete = round) }]}
            />
          </div>
          <div class="settings">
            <Field label="Type">
              <select value={round.type} onchange={(e) => retype(round, e.currentTarget.value as RoundType)}>
                {#each Object.entries(ROUND_TYPE_LABELS) as [type, label] (type)}
                  <option value={type}>{label}</option>
                {/each}
              </select>
            </Field>
            <Field
              label={round.type === 'rapid'
                ? 'Seconds per team'
                : `Timer in seconds, up to ${MAX_TIMER_SECONDS}`}
            >
              <input
                type="number"
                min="1"
                max={round.type === 'rapid' ? RAPID_TIMER_SECONDS : MAX_TIMER_SECONDS}
                value={round.timerSeconds}
                onchange={(e) => retime(round, e.currentTarget)}
              />
            </Field>
            <p class="questions">{countLabel(round)}</p>
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</section>

<Confirm
  bind:open={() => pendingDelete !== null, (isOpen) => !isOpen && (pendingDelete = null)}
  title="Delete this round?"
  confirmLabel="Delete round"
  keepLabel="Keep round"
  onconfirm={confirmDelete}>
  {pendingDelete?.name} will be removed with its {pendingDelete?.questions.length} questions. This cannot be undone.
</Confirm>

<style>
  section {
    display: grid;
    gap: var(--space-3);
  }

  .list-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .count {
    color: var(--muted);
    font-weight: 600;
  }

  ol {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
  }

  .top {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr) auto auto auto;
    align-items: center;
    gap: var(--space-1);
  }

  .number {
    color: var(--muted);
    font-size: var(--step-1);
    font-weight: 800;
    text-align: center;
  }

  .name {
    border-color: transparent;
    font-size: var(--step-1);
    font-weight: 800;
  }

  .name:hover {
    border-color: var(--line);
  }

  .name:focus {
    border-color: var(--accent);
  }

  .settings {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    align-items: end;
    gap: var(--space-3);
    padding-inline-start: calc(2rem + var(--space-1));
  }

  .questions {
    padding-block-end: var(--space-2);
    color: var(--muted);
    font-weight: 600;
  }

  .error {
    color: var(--wrong);
    font-weight: 600;
  }

  .empty {
    color: var(--muted);
  }

  @media (max-width: 40rem) {
    .settings {
      grid-template-columns: minmax(0, 1fr);
      padding-inline-start: 0;
    }
  }
</style>
