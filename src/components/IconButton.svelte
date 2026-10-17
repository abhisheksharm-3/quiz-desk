<!-- Icon-only native button with a required accessible label. -->
<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';

  let {
    label,
    icon,
    ...rest
  }: { label: string; icon: 'up' | 'down' } & HTMLButtonAttributes = $props();
</script>

<button type="button" aria-label={label} title={label} {...rest}>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={icon === 'up' ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
  </svg>
</button>

<style>
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--control);
    min-height: var(--control);
    padding: 0;
    border: 2px solid transparent;
    border-radius: var(--radius);
    background: transparent;
    color: var(--muted);
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    border-color: var(--line);
    color: var(--fg);
  }

  button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  svg {
    width: 1.5rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
