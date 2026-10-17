<!-- Rounds tab: add, rename, retype, retime, reorder and delete rounds, and edit the selected round's questions. -->
<script lang="ts">
  import Button from '../../components/Button.svelte';
  import Dialog from '../../components/Dialog.svelte';
  import Field from '../../components/Field.svelte';
  import { attempt } from '../../lib/attempt';
  import {
    addQuestion,
    addRound,
    deleteQuestion,
    deleteRound,
    MAX_ROUNDS,
    MAX_TIMER_SECONDS,
    RAPID_TIMER_SECONDS,
    moveRound,
    updateQuestion,
    updateRound,
  } from '../../lib/domain/quiz';
  import type { Question, QuestionDraft, Quiz, Round, RoundType } from '../../lib/domain/types';
  import { commit } from '../../lib/store.svelte';
  import Import from './Import.svelte';
  import QuestionForm from './QuestionForm.svelte';
  import QuestionList from './QuestionList.svelte';

  const TYPE_LABELS: Record<RoundType, string> = {
    standard: 'Standard',
    picture: 'Picture',
    buzzer: 'Buzzer',
    rapid: 'Rapid fire',
  };

  let { quiz }: { quiz: Quiz } = $props();
  let newName = $state('');
  let newType: RoundType = $state('standard');
  let selectedId: string | null = $state(null);
  let editing: Question | null = $state(null);
  let pendingDelete: Round | null = $state(null);
  let message: string | null = $state(null);
  let importing = $state(false);

  const selected = $derived(quiz.rounds.find((round) => round.id === selectedId) ?? quiz.rounds[0] ?? null);
  const selectedIndex = $derived(selected ? quiz.rounds.indexOf(selected) : -1);

  function countLabel(round: Round) {
    const count = round.questions.length;
    const noun = round.type === 'picture' ? 'picture' : 'question';
    return `${count} ${noun}${count === 1 ? '' : 's'}`;
  }

  function select(round: Round) {
    selectedId = round.id;
    editing = null;
    message = null;
  }

  function add(event: SubmitEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    let created: Round | undefined;
    message = attempt(() => commit(() => (created = addRound(quiz, name, newType))));
    if (created) {
      newName = '';
      select(created);
    }
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
    editing = null;
  }

  function retime(round: Round, input: HTMLInputElement) {
    message = attempt(() => commit(() => updateRound(quiz, round.id, { timerSeconds: input.valueAsNumber })));
    if (message) input.value = String(round.timerSeconds);
  }

  function confirmDelete() {
    if (pendingDelete) {
      const { id } = pendingDelete;
      commit(() => deleteRound(quiz, id));
      editing = null;
    }
    pendingDelete = null;
  }

  function saveQuestion(round: Round, draft: QuestionDraft) {
    const target = editing;
    commit(() => (target ? updateQuestion(round, target.id, draft) : addQuestion(round, draft)));
    editing = null;
  }

  function removeQuestion(round: Round, question: Question) {
    commit(() => deleteQuestion(round, question.id));
    if (editing?.id === question.id) editing = null;
  }
</script>

<section>
  <div class="head">
    <h2>Rounds</h2>
    <p class="count">{quiz.rounds.length} / {MAX_ROUNDS}</p>
    <Button type="button" disabled={!selected} onclick={() => (importing = true)}>
      Import from Excel or CSV
    </Button>
  </div>

  <form class="add" onsubmit={add}>
    <Field label="Round name">
      <input bind:value={newName} autocomplete="off" />
    </Field>
    <Field label="Type">
      <select bind:value={newType}>
        {#each Object.entries(TYPE_LABELS) as [type, label] (type)}
          <option value={type}>{label}</option>
        {/each}
      </select>
    </Field>
    <Button type="submit" variant="primary" disabled={!newName.trim() || quiz.rounds.length >= MAX_ROUNDS}>
      Add round
    </Button>
  </form>

  {#if message}
    <p class="error" role="alert">{message}</p>
  {/if}

  {#if selected}
    <div class="layout">
      <nav aria-label="Rounds">
        <ol>
          {#each quiz.rounds as round, index (round.id)}
            <li>
              <button
                type="button"
                aria-current={round.id === selected.id ? 'true' : undefined}
                onclick={() => select(round)}
              >
                <strong>{index + 1}. {round.name}</strong>
                <span>{TYPE_LABELS[round.type]}, {countLabel(round)}</span>
              </button>
            </li>
          {/each}
        </ol>
      </nav>

      <div class="detail">
        <div class="settings">
          <Field label="Name">
            <input value={selected.name} autocomplete="off" onchange={(e) => rename(selected, e.currentTarget)} />
          </Field>
          <Field label="Type">
            <select value={selected.type} onchange={(e) => retype(selected, e.currentTarget.value as RoundType)}>
              {#each Object.entries(TYPE_LABELS) as [type, label] (type)}
                <option value={type}>{label}</option>
              {/each}
            </select>
          </Field>
          <Field label={selected.type === 'rapid' ? 'Seconds per team' : `Timer in seconds, up to ${MAX_TIMER_SECONDS}`}>
            <input
              type="number"
              min="1"
              max={selected.type === 'rapid' ? RAPID_TIMER_SECONDS : MAX_TIMER_SECONDS}
              value={selected.timerSeconds}
              onchange={(e) => retime(selected, e.currentTarget)}
            />
          </Field>
        </div>
        <div class="buttons">
          <Button
            type="button"
            disabled={selectedIndex === 0}
            onclick={() => commit(() => moveRound(quiz, selected.id, -1))}
          >
            Move up <span class="sr">{selected.name}</span>
          </Button>
          <Button
            type="button"
            disabled={selectedIndex === quiz.rounds.length - 1}
            onclick={() => commit(() => moveRound(quiz, selected.id, 1))}
          >
            Move down <span class="sr">{selected.name}</span>
          </Button>
          <Button type="button" variant="danger" onclick={() => (pendingDelete = selected)}>
            Delete round <span class="sr">{selected.name}</span>
          </Button>
        </div>

        <QuestionList
          round={selected}
          languageMode={quiz.languageMode}
          onedit={(question) => (editing = question)}
          ondelete={(question) => removeQuestion(selected, question)}
        />
        {#key editing?.id}
          <QuestionForm
            {quiz}
            round={selected}
            {editing}
            onsave={(draft) => saveQuestion(selected, draft)}
            oncancel={() => (editing = null)}
          />
        {/key}
      </div>
    </div>
  {:else}
    <p class="empty">No rounds yet. Add a round, choose its type, then fill it with questions.</p>
  {/if}
</section>

<Import {quiz} bind:open={importing} />

<Dialog
  bind:open={() => pendingDelete !== null, (isOpen) => !isOpen && (pendingDelete = null)}
  title="Delete this round?"
>
  <p>{pendingDelete?.name} will be removed with its {pendingDelete?.questions.length} questions. This cannot be undone.</p>
  <div class="dialog-buttons">
    <Button type="button" onclick={() => (pendingDelete = null)}>Keep round</Button>
    <Button type="button" variant="danger" onclick={confirmDelete}>Delete round</Button>
  </div>
</Dialog>

<style>
  section {
    display: grid;
    gap: var(--space-3);
  }

  .head {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    max-width: 38rem;
  }

  .head :global(button) {
    margin-inline-start: auto;
  }

  .count {
    color: var(--muted);
    font-weight: 600;
  }

  .add {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) auto;
    align-items: end;
    gap: var(--space-2);
    max-width: 38rem;
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr);
    gap: var(--space-5);
    align-items: start;
  }

  nav li {
    min-width: 0;
  }

  nav ol {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  nav button {
    display: grid;
    width: 100%;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: transparent;
    color: var(--fg);
    font: inherit;
    text-align: start;
    overflow-wrap: anywhere;
    cursor: pointer;
  }

  nav button span {
    color: var(--muted);
    font-size: var(--step--1);
  }

  nav button[aria-current='true'] {
    border: 2px solid var(--accent);
    padding: calc(var(--space-2) - 1px) calc(var(--space-3) - 1px);
  }

  .detail {
    display: grid;
    gap: var(--space-4);
    min-width: 0;
  }

  .settings {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space-3);
  }

  .buttons,
  .dialog-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .dialog-buttons {
    justify-content: flex-end;
  }

  .error {
    color: var(--wrong);
    font-weight: 600;
  }

  .empty {
    color: var(--muted);
  }

  @media (max-width: 48rem) {
    .layout,
    .settings {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
