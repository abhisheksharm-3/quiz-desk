<!-- Select whose last option, "Add new…", swaps in a text input that appends to the list. -->
<script lang="ts">
  import { tick } from 'svelte';
  import Button from './Button.svelte';
  import Field from './Field.svelte';

  let {
    label,
    options,
    value = $bindable(''),
    onadd,
  }: { label: string; options: string[]; value: string; onadd: (name: string) => void } = $props();

  const ADD_NEW = '__add_new__';
  let adding = $state(false);
  let draft = $state('');
  let select: HTMLSelectElement | undefined = $state();
  let addInput: HTMLInputElement | undefined = $state();

  async function choose(event: Event & { currentTarget: HTMLSelectElement }) {
    const picked = event.currentTarget.value;
    if (picked === ADD_NEW) {
      adding = true;
      event.currentTarget.value = value;
      await tick();
      addInput?.focus();
    } else {
      value = picked;
    }
  }

  async function closeAddRow() {
    draft = '';
    adding = false;
    await tick();
    select?.focus();
  }

  /** Saves a non-empty "Add new" draft; the form calls it on submit so a typed value is not lost. */
  export function commitDraft() {
    if (adding) saveDraft();
  }

  function saveDraft() {
    const name = draft.trim();
    if (name) {
      const existing = options.find((option) => option.toLowerCase() === name.toLowerCase());
      if (!existing) onadd(name);
      value = existing ?? name;
    }
    draft = '';
    adding = false;
  }

  async function confirmAdd() {
    saveDraft();
    await tick();
    select?.focus();
  }
</script>

{#if adding}
  <div class="add">
    <Field label="New {label.toLowerCase()}">
      <input
        bind:value={draft}
        bind:this={addInput}
        onkeydown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            confirmAdd();
          }
        }}
      />
    </Field>
    <Button type="button" variant="primary" onclick={confirmAdd}>Add</Button>
    <Button type="button" onclick={closeAddRow}>
      Cancel <span class="sr">new {label.toLowerCase()}</span>
    </Button>
  </div>
{:else}
  <Field {label}>
    <select bind:this={select} {value} onchange={choose}>
      {#each options as option (option)}
        <option value={option} selected={option === value}>{option}</option>
      {/each}
      <option value={ADD_NEW}>Add new…</option>
    </select>
  </Field>
{/if}

<style>
  .add {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: end;
    gap: var(--space-2);
  }
</style>
