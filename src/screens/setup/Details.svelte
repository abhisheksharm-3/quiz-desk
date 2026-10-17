<!-- Details tab: the quiz's title, level, subject, venue, quiz masters and on-screen language. -->
<script lang="ts">
  import Field from '../../components/Field.svelte';
  import SelectWithAdd from '../../components/SelectWithAdd.svelte';
  import type { Quiz } from '../../lib/domain/types';
  import { app, commit } from '../../lib/store.svelte';

  let { quiz }: { quiz: Quiz } = $props();

  function saveText(key: 'title' | 'venue' | 'quizMasters', input: HTMLInputElement) {
    const value = input.value.trim();
    if (key === 'title' && !value) {
      input.value = quiz.title;
      return;
    }
    commit(() => (quiz[key] = value));
  }

  function saveLanguage(value: string) {
    commit(() => (quiz.languageMode = value as Quiz['languageMode']));
  }
</script>

<form onsubmit={(event) => event.preventDefault()}>
  <Field label="Title">
    <input value={quiz.title} autocomplete="off" onchange={(e) => saveText('title', e.currentTarget)} />
  </Field>
  <SelectWithAdd
    label="Level"
    options={app.levels}
    bind:value={() => quiz.level, (level) => commit(() => (quiz.level = level))}
    onadd={(name) => commit((data) => data.levels.push(name))}
  />
  <SelectWithAdd
    label="Subject"
    options={app.subjects}
    bind:value={() => quiz.subject, (subject) => commit(() => (quiz.subject = subject))}
    onadd={(name) => commit((data) => data.subjects.push(name))}
  />
  <Field label="Venue">
    <input value={quiz.venue} autocomplete="off" onchange={(e) => saveText('venue', e.currentTarget)} />
  </Field>
  <Field label="Quiz masters">
    <input
      value={quiz.quizMasters}
      autocomplete="off"
      onchange={(e) => saveText('quizMasters', e.currentTarget)}
    />
  </Field>
  <Field label="Language shown on screen">
    <select value={quiz.languageMode} onchange={(e) => saveLanguage(e.currentTarget.value)}>
      <option value="both">English and Hindi</option>
      <option value="en">English only</option>
      <option value="hi">Hindi only</option>
    </select>
  </Field>
</form>

<style>
  form {
    display: grid;
    gap: var(--space-3);
    max-width: 34rem;
  }
</style>
