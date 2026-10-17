<!-- Questions step: pick a round, then add, edit and delete its questions, or import them from a spreadsheet. -->
<script lang="ts">
  import Button from '../../components/Button.svelte';
  import Confirm from '../../components/Confirm.svelte';
  import { addQuestion, deleteQuestion, updateQuestion } from '../../lib/domain/quiz';
  import { ROUND_TYPE_LABELS } from '../../lib/domain/questions';
  import type { ReadyIssue, SetupStep } from '../../lib/domain/ready';
  import type { Question, QuestionDraft, Quiz, Round } from '../../lib/domain/types';
  import { commit } from '../../lib/store.svelte';
  import Import from './Import.svelte';
  import QuestionForm from './QuestionForm.svelte';
  import QuestionList from './QuestionList.svelte';

  let {
    quiz,
    selectedId = $bindable(null),
    issues,
    onstep,
  }: {
    quiz: Quiz;
    selectedId: string | null;
    issues: ReadyIssue[];
    onstep: (step: SetupStep) => void;
  } = $props();

  let formOpen = $state(false);
  let editing: Question | null = $state(null);
  let pendingDelete: Question | null = $state(null);
  let importing = $state(false);

  const selected = $derived(quiz.rounds.find((round) => round.id === selectedId) ?? quiz.rounds[0] ?? null);
  const noun = $derived(selected?.type === 'picture' ? 'picture' : 'question');
  const needsMore = $derived(issues.some((issue) => issue.roundId === selected?.id));

  function isComplete(round: Round) {
    return !issues.some((issue) => issue.roundId === round.id);
  }

  function select(round: Round) {
    selectedId = round.id;
    formOpen = false;
    editing = null;
  }

  function openAdd() {
    editing = null;
    formOpen = true;
  }

  function openEdit(question: Question) {
    editing = question;
    formOpen = true;
  }

  function closeForm() {
    formOpen = false;
    editing = null;
  }

  function saveQuestion(round: Round, draft: QuestionDraft) {
    const target = editing;
    commit(() => (target ? updateQuestion(round, target.id, draft) : addQuestion(round, draft)));
    if (target) closeForm();
  }

  function confirmDelete() {
    if (pendingDelete && selected) {
      const { id } = pendingDelete;
      commit(() => deleteQuestion(selected, id));
      if (editing?.id === id) closeForm();
    }
    pendingDelete = null;
  }
</script>

{#if !selected}
  <section class="empty">
    <p>Questions belong to rounds, and this quiz has none yet.</p>
    <Button type="button" variant="primary" onclick={() => onstep('rounds')}>Add a round first</Button>
  </section>
{:else}
  <section>
    <nav aria-label="Rounds">
      <ol>
        {#each quiz.rounds as round (round.id)}
          <li>
            <button
              type="button"
              aria-current={round.id === selected.id ? 'true' : undefined}
              onclick={() => select(round)}
            >
              <span class="round-name">{round.name}</span>
              <span class="round-meta">
                {#if isComplete(round)}<span class="done" aria-label="complete">✓</span>{/if}
                {round.questions.length}
              </span>
            </button>
          </li>
        {/each}
      </ol>
    </nav>

    <div class="head">
      <div>
        <h3>{selected.name}</h3>
        <p class="meta">{ROUND_TYPE_LABELS[selected.type]}, {selected.questions.length} {noun}{selected.questions.length === 1 ? '' : 's'}</p>
      </div>
      <div class="buttons">
        <Button type="button" onclick={() => (importing = true)}>Import from Excel</Button>
        <Button type="button" variant={needsMore && !formOpen ? 'primary' : 'quiet'} onclick={openAdd}>
          + Add {noun}
        </Button>
      </div>
    </div>

    {#if formOpen}
      <div class="panel">
        {#key editing?.id}
          <QuestionForm
            {quiz}
            round={selected}
            {editing}
            onsave={(draft) => saveQuestion(selected, draft)}
            oncancel={closeForm}
          />
        {/key}
      </div>
    {/if}

    <QuestionList
      round={selected}
      languageMode={quiz.languageMode}
      onedit={openEdit}
      ondelete={(question) => (pendingDelete = question)}
    />
  </section>
{/if}

<Import {quiz} bind:open={importing} />

<Confirm
  bind:open={() => pendingDelete !== null, (isOpen) => !isOpen && (pendingDelete = null)}
  title="Delete this {noun}?"
  confirmLabel="Delete {noun}"
  keepLabel="Keep {noun}"
  onconfirm={confirmDelete}>
  It will be removed from {selected?.name}. This cannot be undone.
</Confirm>

<style>
  section {
    display: grid;
    gap: var(--space-4);
  }

  .empty {
    justify-items: start;
  }

  .empty p {
    color: var(--muted);
  }

  nav ol {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  nav button {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    min-height: var(--control);
    padding: var(--space-2) var(--space-3);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: transparent;
    color: var(--fg);
    font: inherit;
    font-weight: 600;
    text-align: start;
    overflow-wrap: anywhere;
    cursor: pointer;
  }

  nav button[aria-current='true'] {
    border-color: var(--accent);
    background: var(--accent-bg);
    color: var(--accent-fg);
  }

  .round-meta {
    font-size: var(--step--1);
    font-weight: 400;
    opacity: 0.85;
  }

  .done {
    color: var(--right);
  }

  nav button[aria-current='true'] .done {
    color: inherit;
  }

  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .meta {
    color: var(--muted);
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .panel {
    padding: var(--space-4);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
  }
</style>
