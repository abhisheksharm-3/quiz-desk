<!-- Confirmation dialog for a destructive action: the message, a quiet keep button and a danger confirm button. -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';
  import Dialog from './Dialog.svelte';

  let {
    open = $bindable(false),
    title,
    confirmLabel,
    keepLabel,
    onconfirm,
    children,
  }: {
    open: boolean;
    title: string;
    confirmLabel: string;
    keepLabel: string;
    onconfirm: () => void;
    children: Snippet;
  } = $props();
</script>

<Dialog bind:open {title}>
  <p>{@render children()}</p>
  <div class="buttons">
    <Button type="button" onclick={() => (open = false)}>{keepLabel}</Button>
    <Button type="button" variant="danger" onclick={onconfirm}>{confirmLabel}</Button>
  </div>
</Dialog>

<style>
  .buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-2);
  }
</style>
