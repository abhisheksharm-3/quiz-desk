<!-- Popover menu of actions: an icon-only "More" trigger by default, or a custom trigger. Items close the menu, then run. -->
<script module lang="ts">
  export interface MenuItem {
    text: string;
    run: () => void;
    danger?: boolean;
    current?: boolean;
    hint?: string;
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import Kbd from './Kbd.svelte';

  let {
    label,
    items,
    trigger,
    align = 'end',
  }: { label: string; items: MenuItem[]; trigger?: Snippet; align?: 'start' | 'end' } = $props();

  const id = $props.id();
  const GAP = 8;
  let button: HTMLButtonElement;
  let panel: HTMLElement;

  function place(): void {
    const box = button.getBoundingClientRect();
    const opensUp = box.top > innerHeight / 2;
    const { style } = panel;
    style.top = opensUp ? 'auto' : `${box.bottom + GAP}px`;
    style.bottom = opensUp ? `${innerHeight - box.top + GAP}px` : 'auto';
    style.left = align === 'start' ? `${box.left}px` : 'auto';
    style.right = align === 'end' ? `${innerWidth - box.right}px` : 'auto';
  }

  function choose(item: MenuItem): void {
    panel.hidePopover();
    item.run();
  }
</script>

<button
  bind:this={button}
  type="button"
  class="trigger"
  class:icon={!trigger}
  popovertarget={id}
  aria-label={trigger ? undefined : label}
  aria-haspopup="true"
>
  {#if trigger}
    {@render trigger()}
  {:else}
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  {/if}
</button>

<div {id} bind:this={panel} popover="auto" aria-label={label} onbeforetoggle={place}>
  {#each items as item (item.text)}
    <button
      type="button"
      class:danger={item.danger}
      aria-current={item.current ? 'true' : undefined}
      onclick={() => choose(item)}
    >
      <span>{item.text}</span>
      {#if item.hint}<Kbd key={item.hint} />{/if}
    </button>
  {/each}
</div>

<style>
  .trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: var(--control);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: transparent;
    color: var(--fg);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .trigger:not(.icon) {
    padding: var(--space-2) var(--space-4);
  }

  .icon {
    width: var(--control);
    padding: 0;
    border-color: transparent;
    color: var(--muted);
  }

  .icon:hover,
  .trigger:popover-open {
    border-color: var(--line);
    color: var(--fg);
  }

  svg {
    width: 1.5rem;
    fill: currentColor;
  }

  div {
    inset: auto;
    margin: 0;
    min-width: 13rem;
    max-width: calc(100vw - 2 * var(--space-3));
    padding: var(--space-1);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--fg);
  }

  div:popover-open {
    display: grid;
    animation: fade var(--dur) var(--ease-out);
  }

  div button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    min-height: var(--control);
    padding: var(--space-2) var(--space-3);
    border: 0;
    border-radius: calc(var(--radius) - 2px);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }

  div button:hover {
    background: var(--line);
  }

  div button[aria-current='true'] {
    color: var(--accent);
    font-weight: 600;
  }

  div button[aria-current='true']::after {
    content: '✓';
  }

  div button.danger {
    color: var(--wrong);
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
