<!-- Home: the quiz list, the new-quiz dialog, delete confirmation and the settings popover. -->
<script lang="ts">
  import Button from '../components/Button.svelte';
  import Dialog from '../components/Dialog.svelte';
  import Field from '../components/Field.svelte';
  import SelectWithAdd from '../components/SelectWithAdd.svelte';
  import { createQuiz, deleteQuiz } from '../lib/domain/quiz';
  import { readyCheck } from '../lib/domain/ready';
  import type { Quiz } from '../lib/domain/types';
  import { go } from '../lib/nav.svelte';
  import { app, commit } from '../lib/store.svelte';

  let creating = $state(false);
  let pendingDelete: Quiz | null = $state(null);
  let notReady: Quiz | null = $state(null);
  let draft = $state(blankDraft());
  let levelField: SelectWithAdd;
  let subjectField: SelectWithAdd;

  const dateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' });

  function blankDraft() {
    return { title: '', level: '', subject: '', venue: '', quizMasters: '' };
  }

  function startCreate() {
    draft = { ...blankDraft(), level: app.levels[0] ?? '', subject: app.subjects[0] ?? '' };
    creating = true;
  }

  function submitCreate(event: SubmitEvent) {
    event.preventDefault();
    levelField.commitDraft();
    subjectField.commitDraft();
    commit((data) => createQuiz(data, { ...draft, title: draft.title.trim() }));
    creating = false;
  }

  function askDelete(quiz: Quiz) {
    pendingDelete = quiz;
  }

  function confirmDelete() {
    if (pendingDelete) {
      const { id } = pendingDelete;
      commit((data) => deleteQuiz(data, id));
    }
    pendingDelete = null;
  }

  function run(quiz: Quiz) {
    if (readyCheck(quiz).length > 0) notReady = quiz;
    else openLive(quiz);
  }

  function openLive(quiz: Quiz) {
    notReady = null;
    go({ screen: 'live', quizId: quiz.id, roundId: null });
  }

  function setTheme(theme: 'yellow' | 'orange') {
    commit((data) => (data.theme = theme));
  }

  function toggleMuted() {
    commit((data) => (data.muted = !data.muted));
  }

  function hasDevanagari(text: string) {
    return /\p{Script=Devanagari}/u.test(text);
  }

  function plural(count: number, noun: string) {
    return `${count} ${noun}${count === 1 ? '' : 's'}`;
  }
</script>

<main>
  <header>
    <h1>Quiz Desk</h1>
    <div class="tools">
      <Button type="button" popovertarget="settings">Settings</Button>
      {#if app.quizzes.length > 0}
        <Button type="button" onclick={startCreate}>New quiz</Button>
      {/if}
    </div>
    <div id="settings" popover="auto">
      <h2>Settings</h2>
      <div class="group" role="group" aria-label="Highlight colour">
        <span>Highlight colour</span>
        <Button type="button" aria-pressed={app.theme === 'yellow'} onclick={() => setTheme('yellow')}>
          Yellow
        </Button>
        <Button type="button" aria-pressed={app.theme === 'orange'} onclick={() => setTheme('orange')}>
          Orange
        </Button>
      </div>
      <Button type="button" aria-pressed={app.muted} onclick={toggleMuted}>Mute sound</Button>
    </div>
  </header>

  {#if app.quizzes.length === 0}
    <section class="empty">
      <h2>No quizzes yet</h2>
      <p>Start by creating a quiz. Then add its teams, rounds and questions, and run it on the projector.</p>
      <Button type="button" variant="primary" onclick={startCreate}>Create your first quiz</Button>
    </section>
  {:else}
    <ul>
      {#each app.quizzes as quiz (quiz.id)}
        <li>
          <div class="summary">
            <h2 lang={hasDevanagari(quiz.title) ? 'hi' : undefined}>{quiz.title}</h2>
            <p>{quiz.level} · {quiz.subject}</p>
            <p class="meta">
              {plural(quiz.teams.length, 'team')}, {plural(quiz.rounds.length, 'round')}, created
              {dateFormat.format(quiz.createdAt)}
            </p>
          </div>
          <div class="actions">
            <Button type="button" onclick={() => go({ screen: 'setup', quizId: quiz.id })}>
              Open <span class="sr">{quiz.title}</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              onclick={() => run(quiz)}
            >
              Run <span class="sr">{quiz.title}</span>
            </Button>
            <Button type="button" variant="quiet" onclick={() => askDelete(quiz)}>
              Delete <span class="sr">{quiz.title}</span>
            </Button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</main>

<Dialog bind:open={creating} title="New quiz">
  <form onsubmit={submitCreate}>
    <Field label="Title">
      <input bind:value={draft.title} autocomplete="off" />
    </Field>
    <SelectWithAdd
      bind:this={levelField}
      label="Level"
      options={app.levels}
      bind:value={draft.level}
      onadd={(name) => commit((data) => data.levels.push(name))}
    />
    <SelectWithAdd
      bind:this={subjectField}
      label="Subject"
      options={app.subjects}
      bind:value={draft.subject}
      onadd={(name) => commit((data) => data.subjects.push(name))}
    />
    <Field label="Venue">
      <input bind:value={draft.venue} autocomplete="off" />
    </Field>
    <Field label="Quiz masters">
      <input bind:value={draft.quizMasters} autocomplete="off" />
    </Field>
    <div class="buttons">
      <Button type="button" onclick={() => (creating = false)}>Cancel</Button>
      <Button type="submit" variant="primary" disabled={!draft.title.trim()}>Create quiz</Button>
    </div>
  </form>
</Dialog>

<Dialog
  bind:open={() => pendingDelete !== null, (isOpen) => !isOpen && (pendingDelete = null)}
  title="Delete this quiz?">
  <p>
    {pendingDelete?.title} will be removed with its teams, rounds, questions and scores. This cannot be
    undone.
  </p>
  <div class="buttons">
    <Button type="button" onclick={() => (pendingDelete = null)}>Keep quiz</Button>
    <Button type="button" variant="danger" onclick={confirmDelete}>Delete quiz</Button>
  </div>
</Dialog>

<Dialog
  bind:open={() => notReady !== null, (isOpen) => !isOpen && (notReady = null)}
  title="This quiz is not ready">
  {#if notReady}
    <ul class="problems">
      {#each readyCheck(notReady) as problem (problem)}
        <li>{problem}</li>
      {/each}
    </ul>
    <div class="buttons">
      <Button type="button" onclick={() => openLive(notReady!)}>Run anyway</Button>
      <Button
        type="button"
        variant="primary"
        onclick={() => notReady && go({ screen: 'setup', quizId: notReady.id })}>
        Open setup
      </Button>
    </div>
  {/if}
</Dialog>

<style>
  main {
    max-width: 64rem;
    margin: 0 auto;
    padding: var(--space-5) var(--space-4) var(--space-6);
  }

  header {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-block-end: var(--space-5);
  }

  h1 {
    color: var(--accent);
    font-size: var(--step-4);
  }

  .tools,
  .actions,
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .buttons {
    justify-content: flex-end;
  }

  #settings {
    inset: auto;
    top: calc(var(--space-5) + 3.5rem);
    right: max(var(--space-4), calc((100vw - 64rem) / 2 + var(--space-4)));
    margin: 0;
    padding: var(--space-4);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--fg);
  }

  #settings:popover-open {
    display: grid;
    gap: var(--space-3);
  }

  .group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .group span {
    flex-basis: 100%;
    font-size: var(--step--1);
    font-weight: 600;
    color: var(--muted);
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    border-block-start: 1px solid var(--line);
  }

  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-3) var(--space-5);
    padding-block: var(--space-4);
    border-block-end: 1px solid var(--line);
  }

  .summary {
    min-width: 0;
    display: grid;
    gap: var(--space-1);
  }

  @media (max-width: 40rem) {
    li {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .problems {
    display: grid;
    gap: var(--space-2);
    max-height: 50dvh;
    margin-block-end: var(--space-3);
    padding-inline-start: var(--space-4);
    overflow-y: auto;
    list-style: disc;
    border: 0;
  }

  .problems li {
    display: list-item;
    padding: 0;
    border: 0;
  }

  .meta {
    font-size: var(--step--1);
    color: var(--muted);
  }

  .empty {
    display: grid;
    justify-items: start;
    gap: var(--space-3);
    max-width: 38rem;
    padding-block: var(--space-6);
  }

  form {
    display: grid;
    gap: var(--space-3);
  }
</style>
