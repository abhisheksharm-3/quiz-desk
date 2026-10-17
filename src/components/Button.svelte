<!-- Native button in three variants: primary, quiet, danger. -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  let {
    variant = 'quiet',
    children,
    ...rest
  }: { variant?: 'primary' | 'quiet' | 'danger'; children: Snippet } & HTMLButtonAttributes =
    $props();
</script>

<button class={variant} {...rest}>{@render children()}</button>

<style>
  button {
    min-height: 2.75rem;
    padding: var(--space-2) var(--space-4);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: transparent;
    color: var(--fg);
    font: inherit;
    font-size: var(--step-0);
    font-weight: 600;
    cursor: pointer;
    transition: opacity var(--dur) var(--ease-out), transform var(--dur) var(--ease-out);
  }

  button:active:not(:disabled) {
    transform: scale(0.97);
  }

  .primary {
    border-color: var(--accent);
    background: var(--accent-bg);
    color: var(--accent-fg);
  }

  .danger {
    border-color: var(--wrong);
    color: var(--wrong);
  }

  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
