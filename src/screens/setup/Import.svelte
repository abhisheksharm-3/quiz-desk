<!-- Import dialog: download the template, choose a filled-in file, review valid rows, errors and duplicates, then import. -->
<script lang="ts">
  import Button from '../../components/Button.svelte';
  import Dialog from '../../components/Dialog.svelte';
  import { textKeys } from '../../lib/domain/duplicate';
  import { parseQuestionRows, type ImportError, type ImportItem } from '../../lib/domain/importRows';
  import { addQuestion } from '../../lib/domain/quiz';
  import type { Quiz } from '../../lib/domain/types';
  import { pickSpreadsheet, saveBytes } from '../../lib/files';
  import { readSheet, templateBytes } from '../../lib/spreadsheet';
  import { commit } from '../../lib/store.svelte';

  let { quiz, open = $bindable(false) }: { quiz: Quiz; open: boolean } = $props();
  let preview = $state<{ items: ImportItem[]; errors: ImportError[] } | null>(null);
  let failure: string | null = $state(null);

  function setOpen(isOpen: boolean) {
    open = isOpen;
    if (!isOpen) {
      preview = null;
      failure = null;
    }
  }

  const rows = $derived.by(() => {
    const inQuiz = new Set(quiz.rounds.flatMap((round) => round.questions.flatMap(textKeys)));
    const inFile = new Set<string>();
    return (preview?.items ?? []).map((item) => {
      const keys = textKeys(item.draft);
      const note = keys.some((key) => inQuiz.has(key))
        ? 'Already in this quiz'
        : keys.some((key) => inFile.has(key))
          ? 'Repeated earlier in this file'
          : '';
      keys.forEach((key) => inFile.add(key));
      return { item, round: quiz.rounds.find((round) => round.id === item.roundId)?.name ?? '', note };
    });
  });

  async function downloadTemplate() {
    failure = null;
    try {
      await saveBytes('quiz-desk-template.xlsx', templateBytes(quiz));
    } catch {
      failure = 'The template could not be saved. Choose another folder and try again.';
    }
  }

  async function chooseFile() {
    failure = null;
    try {
      const bytes = await pickSpreadsheet();
      if (bytes) preview = parseQuestionRows(quiz, readSheet(bytes));
    } catch {
      preview = null;
      failure = 'This file could not be read. Use the template, or a .csv file saved as UTF-8.';
    }
  }

  function confirmImport() {
    const items = preview?.items ?? [];
    commit(() => {
      for (const { roundId, draft } of items) {
        const round = quiz.rounds.find((candidate) => candidate.id === roundId);
        if (round) addQuestion(round, draft);
      }
    });
    setOpen(false);
  }
</script>

<Dialog bind:open={() => open, setOpen} title="Import questions">
  <p>Fill in the template with a Round column that matches your round names. Pictures are added by hand.</p>
  <div class="buttons">
    <Button type="button" onclick={downloadTemplate}>Download template</Button>
    <Button type="button" onclick={chooseFile}>Choose file</Button>
  </div>

  {#if failure}
    <p class="error" role="alert">{failure}</p>
  {/if}

  {#if preview}
    <div class="result" role="status">
      <h3>{preview.items.length} {preview.items.length === 1 ? 'question' : 'questions'} ready to import</h3>
      {#if preview.errors.length > 0}
        <p class="error">{preview.errors.length} {preview.errors.length === 1 ? 'problem' : 'problems'} found. Rows with problems are skipped.</p>
        <ul class="errors">
          {#each preview.errors as error (error.row)}
            <li>{error.message}</li>
          {/each}
        </ul>
      {/if}
    </div>

    {#if rows.length > 0}
      <div class="table">
        <table>
          <caption class="sr">Questions that will be imported</caption>
          <thead>
            <tr><th scope="col">Round</th><th scope="col">Question</th><th scope="col">Note</th></tr>
          </thead>
          <tbody>
            {#each rows as row, index (index)}
              <tr>
                <td>{row.round}</td>
                <td lang={row.item.draft.en ? undefined : 'hi'}>{row.item.draft.en || row.item.draft.hi}</td>
                <td>{row.note}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}

  <div class="buttons end">
    <Button type="button" onclick={() => setOpen(false)}>Cancel</Button>
    <Button type="button" variant="primary" disabled={!preview || preview.items.length === 0} onclick={confirmImport}>
      Import {preview?.items.length ?? 0} {preview?.items.length === 1 ? 'question' : 'questions'}
    </Button>
  </div>
</Dialog>

<style>
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .end {
    justify-content: flex-end;
  }

  .error {
    color: var(--wrong);
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .errors {
    overflow-wrap: anywhere;
    display: grid;
    gap: var(--space-1);
    margin: var(--space-2) 0 0;
    padding-inline-start: var(--space-4);
  }

  .table {
    max-height: 16rem;
    overflow: auto;
    border-block: 1px solid var(--line);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--step--1);
  }

  th,
  td {
    padding: var(--space-2);
    text-align: start;
    vertical-align: top;
    overflow-wrap: anywhere;
    border-block-end: 1px solid var(--line);
  }
</style>
