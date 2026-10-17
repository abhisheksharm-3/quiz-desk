<!-- Home: the quiz list with each quiz's status and next step, the new-quiz dialog and the settings menu. -->
<script lang="ts">
  import Button from '../components/Button.svelte';
  import Confirm from '../components/Confirm.svelte';
  import Dialog from '../components/Dialog.svelte';
  import Field from '../components/Field.svelte';
  import Menu from '../components/Menu.svelte';
  import SelectWithAdd from '../components/SelectWithAdd.svelte';
  import { createQuiz, deleteQuiz } from '../lib/domain/quiz';
  import { readyIssues } from '../lib/domain/ready';
  import type { Quiz } from '../lib/domain/types';
  import { go } from '../lib/nav.svelte';
  import { app, commit } from '../lib/store.svelte';

  let creating = $state(false);
  let pendingDelete: Quiz | null = $state(null);
  let draft = $state(blankDraft());
  let levelField: SelectWithAdd;
  let subjectField: SelectWithAdd;

  const dateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' });

  const settingsItems = $derived([
    { text: 'Yellow highlight', current: app.theme === 'yellow', run: () => setTheme('yellow') },
    { text: 'Orange highlight', current: app.theme === 'orange', run: () => setTheme('orange') },
    { text: app.muted ? 'Unmute sound' : 'Mute sound', run: toggleMuted },
  ]);

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
    let created: Quiz | undefined;
    commit((data) => (created = createQuiz(data, { ...draft, title: draft.title.trim() })));
    creating = false;
    if (created) go({ screen: 'setup', quizId: created.id, step: 'teams' });
  }

  function confirmDelete() {
    if (pendingDelete) {
      const { id } = pendingDelete;
      commit((data) => deleteQuiz(data, id));
    }
    pendingDelete = null;
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
    <div class="heading">
      <h1>Quiz Desk</h1>
      {#if app.quizzes.length > 0}<p>Start a quiz, or pick up where you left off.</p>{/if}
    </div>
    <div class="tools">
      <Menu label="Settings" items={settingsItems}>
        {#snippet trigger()}Settings{/snippet}
      </Menu>
      {#if app.quizzes.length > 0}
        <Button type="button" variant="primary" onclick={startCreate}>New quiz</Button>
      {/if}
    </div>
  </header>

  {#if app.quizzes.length === 0}
    <section class="empty">
      <h2>No quizzes yet</h2>
      <p>Create a quiz, add its teams, rounds and questions, then run it on the projector.</p>
      <Button type="button" variant="primary" size="large" onclick={startCreate}>Create your first quiz</Button>
    </section>
  {:else}
    <ul>
      {#each app.quizzes as quiz (quiz.id)}
        {@const issues = readyIssues(quiz)}
        <li>
          <div class="summary">
            <h2 lang={hasDevanagari(quiz.title) ? 'hi' : undefined}>{quiz.title}</h2>
            <p class="meta">
              {quiz.level}, {quiz.subject}. {plural(quiz.teams.length, 'team')}, {plural(quiz.rounds.length, 'round')},
              created {dateFormat.format(quiz.createdAt)}
            </p>
            <p class="status" class:ready={issues.length === 0}>
              {issues.length === 0 ? '✓ Ready to run' : `Setup: ${plural(issues.length, 'thing')} left`}
            </p>
          </div>
          <div class="actions">
            {#if issues.length === 0}
              <Button
                type="button"
                variant="primary"
                onclick={() => go({ screen: 'live', quizId: quiz.id, roundId: null })}
              >
                Start quiz <span class="sr">{quiz.title}</span>
              </Button>
            {:else}
              <Button
                type="button"
                variant="primary"
                onclick={() => go({ screen: 'setup', quizId: quiz.id, step: issues[0].step })}
              >
                Continue setup <span class="sr">{quiz.title}</span>
              </Button>
            {/if}
            <Button type="button" onclick={() => go({ screen: 'setup', quizId: quiz.id })}>
              Edit <span class="sr">{quiz.title}</span>
            </Button>
            <Menu
              label="More actions for {quiz.title}"
              items={[{ text: 'Delete quiz', danger: true, run: () => (pendingDelete = quiz) }]}
            />
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

<Confirm
  bind:open={() => pendingDelete !== null, (isOpen) => !isOpen && (pendingDelete = null)}
  title="Delete this quiz?"
  confirmLabel="Delete quiz"
  keepLabel="Keep quiz"
  onconfirm={confirmDelete}>
  {pendingDelete?.title} will be removed with its teams, rounds, questions and scores. This cannot be undone.
</Confirm>

<style>
  main {
    max-width: 62rem;
    margin: 0 auto;
    padding: var(--space-5) var(--space-4) var(--space-6);
  }

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-3);
    margin-block-end: var(--space-5);
  }

  .heading {
    display: grid;
    gap: var(--space-1);
  }

  h1 {
    color: var(--accent);
    font-size: var(--step-4);
  }

  .heading p {
    color: var(--muted);
    font-size: var(--step-1);
  }

  .tools,
  .actions,
  .buttons {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .buttons {
    justify-content: flex-end;
  }

  ul {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-3) var(--space-5);
    padding: var(--space-4);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
  }

  .summary {
    min-width: 0;
    display: grid;
    gap: var(--space-1);
  }

  .meta {
    color: var(--muted);
  }

  .status {
    margin-block-start: var(--space-2);
    font-weight: 600;
  }

  .status.ready {
    color: var(--right);
  }

  .empty {
    display: grid;
    justify-items: start;
    gap: var(--space-3);
    max-width: 38rem;
    padding-block: var(--space-6);
  }

  .empty h2 {
    font-size: var(--step-4);
    font-weight: 800;
  }

  .empty p {
    color: var(--muted);
    font-size: var(--step-1);
  }

  form {
    display: grid;
    gap: var(--space-3);
  }

  @media (max-width: 40rem) {
    li {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
