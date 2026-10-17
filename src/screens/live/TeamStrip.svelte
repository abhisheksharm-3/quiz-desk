<!-- Compact row of team chips with running totals; the current team carries the accent, pickable teams are buttons, locked teams are dimmed. -->
<script lang="ts">
  import Kbd from '../../components/Kbd.svelte';
  import type { Team } from '../../lib/domain/types';

  let {
    teams,
    totals,
    current,
    pickable,
    locked = [],
    keyed = false,
    onpick,
  }: {
    teams: Team[];
    totals: number[];
    current: number | null;
    pickable: boolean;
    locked?: number[];
    keyed?: boolean;
    onpick: (index: number) => void;
  } = $props();
</script>

<ul class="strip" aria-label="Teams">
  {#each teams as team, index (team.id)}
    <li>
      <button
        type="button"
        class:current={index === current}
        aria-current={index === current ? 'true' : undefined}
        class:locked={locked.includes(index)}
        disabled={!pickable || locked.includes(index)}
        onclick={() => onpick(index)}
      >
        <span class="name">
          {#if keyed}<Kbd key={String((index + 1) % 10)} />{/if}
          {team.name}
        </span>
        <span class="total">{totals[index]}</span>
      </button>
    </li>
  {/each}
</ul>

<style>
  .strip {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    min-width: 0;
  }

  button {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    max-width: 22rem;
    padding: 0 var(--space-3);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--fg);
    font: inherit;
    text-align: start;
    cursor: pointer;
  }

  button:disabled {
    cursor: default;
  }

  .locked {
    opacity: 0.4;
    text-decoration: line-through;
  }

  .current {
    border-color: var(--accent);
    background: var(--accent-bg);
    color: var(--accent-fg);
  }

  .name {
    min-width: 0;
    font-size: var(--step-0);
    font-weight: 600;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }

  .total {
    font-size: var(--step-1);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
</style>
