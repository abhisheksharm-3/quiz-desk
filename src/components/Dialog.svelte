<!-- Native modal dialog: showModal traps focus and restores it on close; Escape closes. -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    open = $bindable(false),
    title,
    children,
  }: { open: boolean; title: string; children: Snippet } = $props();

  let dialog: HTMLDialogElement;

  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  });
</script>

<dialog bind:this={dialog} onclose={() => (open = false)} aria-labelledby="dialog-title">
  <h2 id="dialog-title">{title}</h2>
  {@render children()}
</dialog>

<style>
  dialog {
    width: min(34rem, calc(100vw - 2 * var(--space-4)));
    max-height: calc(100dvh - 2 * var(--space-4));
    padding: var(--space-4);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--fg);
    overflow: auto;
  }

  dialog::backdrop {
    background: oklch(0 0 0 / 0.7);
  }

  dialog[open] {
    display: grid;
    gap: var(--space-4);
    animation: rise var(--dur) var(--ease-out);
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(0.5rem);
    }
  }
</style>
