<!-- Question form: English and Hindi side by side, optional A-D options, answers, and a picture for picture rounds. -->
<script lang="ts">
  import { tick, untrack } from 'svelte';
  import Button from '../../components/Button.svelte';
  import Field from '../../components/Field.svelte';
  import { findDuplicate } from '../../lib/domain/duplicate';
  import { correctOptionProblem, OPTION_LETTERS } from '../../lib/domain/options';
  import type { Question, QuestionDraft, Quiz, Round } from '../../lib/domain/types';
  import { importPicture, pictureSrc } from '../../lib/pictures';

  let {
    quiz,
    round,
    editing,
    onsave,
    oncancel,
  }: {
    quiz: Quiz;
    round: Round;
    editing: Question | null;
    onsave: (draft: QuestionDraft) => void;
    oncancel: () => void;
  } = $props();

  const isPicture = $derived(round.type === 'picture');
  let fields = $state(startFields(untrack(() => editing)));
  let zoneField: HTMLButtonElement | undefined = $state();
  let questionField: HTMLTextAreaElement | undefined = $state();
  let lastField: HTMLInputElement | undefined = $state();
  let warnedFor: string | null = $state(null);
  let message: string | null = $state(null);
  let added: string | null = $state(null);

  const duplicate = $derived(findDuplicate(quiz, fields, editing?.id));
  const showDuplicate = $derived(duplicate !== null && warnedFor === duplicate.id);

  function startFields(question: Question | null) {
    return {
      en: question?.en ?? '',
      hi: question?.hi ?? '',
      options: [...(question?.options ?? ['', '', '', ''])],
      correctOption: question?.correctOption ?? null,
      answerEn: question?.answerEn ?? '',
      answerHi: question?.answerHi ?? '',
      image: question?.image ?? null,
    };
  }

  function toDraft(): QuestionDraft {
    const options = fields.options.map((option) => option.trim());
    const hasOptions = !isPicture && options.some(Boolean);
    return {
      en: fields.en.trim(),
      hi: fields.hi.trim(),
      options: hasOptions ? options : null,
      correctOption: hasOptions ? fields.correctOption : null,
      answerEn: fields.answerEn.trim(),
      answerHi: fields.answerHi.trim(),
      image: isPicture ? fields.image : null,
    };
  }

  function missingPart(draft: QuestionDraft): string | null {
    if (isPicture) return draft.image ? null : 'Choose a picture first';
    if (!draft.en && !draft.hi) return 'Type the question in English or Hindi first';
    const problem = correctOptionProblem(draft.options, draft.correctOption);
    return problem && `Fix the options: ${problem}`;
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    message = missingPart(toDraft());
    if (message) return;
    if (duplicate && warnedFor !== duplicate.id) {
      warnedFor = duplicate.id;
      return;
    }
    save();
  }

  $effect(() => {
    focusFirstField();
  });

  function focusFirstField() {
    (isPicture ? zoneField : questionField)?.focus();
  }

  async function save() {
    onsave(toDraft());
    warnedFor = null;
    if (editing) return;
    added = `${isPicture ? 'Picture' : 'Question'} ${round.questions.length} added`;
    fields = startFields(null);
    await tick();
    focusFirstField();
  }

  function enterSavesOnlyLastField(form: HTMLFormElement) {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && event.target instanceof HTMLInputElement && event.target !== lastField) {
        event.preventDefault();
      }
    };
    form.addEventListener('keydown', handler);
    return () => form.removeEventListener('keydown', handler);
  }

  async function choosePicture() {
    try {
      const path = await importPicture();
      if (path) fields.image = path;
      message = null;
    } catch {
      message = 'That picture could not be added. Try another file.';
    }
  }
</script>

<form onsubmit={submit} {@attach enterSavesOnlyLastField}>
  <h3>{editing ? 'Edit' : 'Add'} {isPicture ? 'picture' : 'question'}</h3>

  {#if isPicture}
    <button type="button" class="zone" bind:this={zoneField} onclick={choosePicture}>
      {#if fields.image}
        <img src={pictureSrc(fields.image)} alt="Selected file" />
        <span>Replace picture</span>
      {:else}
        <span>Add picture</span>
        <small>PNG, JPG or WebP</small>
      {/if}
    </button>
  {/if}

  <div class="pair">
    <Field label={isPicture ? 'Caption question (English), optional' : 'Question (English)'}>
      <textarea rows="3" bind:value={fields.en} bind:this={questionField}></textarea>
    </Field>
    <Field label={isPicture ? 'Caption question (Hindi), optional' : 'Question (Hindi)'}>
      <textarea rows="3" lang="hi" bind:value={fields.hi}></textarea>
    </Field>
  </div>

  {#if !isPicture}
    <details open={Boolean(editing?.options)}>
      <summary>Multiple choice options, optional</summary>
      <div class="options">
        {#each OPTION_LETTERS as letter, index (letter)}
          <Field label="Option {letter}">
            <input bind:value={fields.options[index]} autocomplete="off" />
          </Field>
        {/each}
      </div>
      <fieldset>
        <legend>Correct option</legend>
        {#each OPTION_LETTERS as letter (letter)}
          <label>
            <input type="radio" name="correct" value={letter} bind:group={fields.correctOption} />
            {letter}
          </label>
        {/each}
      </fieldset>
    </details>
  {/if}

  <div class="pair">
    <Field label="Answer (English)">
      <input bind:value={fields.answerEn} autocomplete="off" />
    </Field>
    <Field label="Answer (Hindi)">
      <input lang="hi" bind:value={fields.answerHi} bind:this={lastField} autocomplete="off" />
    </Field>
  </div>

  {#if message}
    <p class="error" role="alert">{message}</p>
  {/if}

  {#if showDuplicate && duplicate}
    <div class="warning" role="alert">
      <p>This matches an existing question: {duplicate.en || duplicate.hi}</p>
      <Button type="button" onclick={save}>Save anyway</Button>
    </div>
  {/if}

  <div class="buttons">
    <Button type="button" onclick={oncancel}>{editing ? 'Cancel' : 'Close'}</Button>
    <Button type="submit" variant="primary">
      {editing ? 'Save changes' : isPicture ? 'Add picture to round' : 'Add question'}
    </Button>
    {#if added}
      <p class="added" role="status">{added}</p>
    {/if}
  </div>
</form>

<style>
  form {
    display: grid;
    gap: var(--space-3);
  }

  .pair {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    gap: var(--space-3);
  }

  textarea {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: transparent;
    color: var(--fg);
    font: inherit;
    resize: vertical;
  }

  details {
    display: grid;
    gap: var(--space-3);
  }

  summary {
    cursor: pointer;
    font-weight: 600;
  }

  details[open] summary {
    margin-block-end: var(--space-3);
  }

  .options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: var(--space-3);
  }

  fieldset {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-4);
    margin: var(--space-3) 0 0;
    padding: 0;
    border: 0;
  }

  legend {
    padding: 0;
    margin-block-end: var(--space-2);
    font-size: var(--step--1);
    font-weight: 600;
    color: var(--muted);
  }

  fieldset label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 2.75rem;
  }

  fieldset input {
    width: 1.25rem;
    min-height: 0;
    accent-color: var(--accent);
  }

  .zone {
    display: grid;
    justify-items: center;
    gap: var(--space-2);
    padding: var(--space-4);
    border: 2px dashed var(--line);
    border-radius: var(--radius);
    background: transparent;
    color: var(--fg);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .zone small {
    color: var(--muted);
    font-weight: 400;
  }

  .zone img {
    max-width: 100%;
    max-height: 14rem;
    border-radius: var(--radius);
  }

  .error {
    color: var(--wrong);
    font-weight: 600;
  }

  .warning {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3);
    border: 2px solid var(--accent);
    border-radius: var(--radius);
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-3);
  }

  .added {
    margin-inline-end: auto;
    color: var(--right);
    font-weight: 600;
  }
</style>
