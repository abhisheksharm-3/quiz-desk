<!-- Every team with its running total; the current team carries the accent label, pickable teams are buttons, locked teams are dimmed. -->
<script lang="ts">
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
          {#if keyed}<kbd>{(index + 1) % 10}</kbd>{/if}
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
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  button {
    display: grid;
    gap: var(--space-1);
    min-width: 8rem;
    padding: var(--space-2) var(--space-3);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: transparent;
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

  kbd {
    margin-inline-end: var(--space-1);
    padding: 0 var(--space-1);
    border: 1px solid currentColor;
    border-radius: var(--radius);
    font: inherit;
    font-size: var(--step--1);
  }

  .current {
    border-color: var(--accent);
    background: var(--accent-bg);
    color: var(--accent-fg);
  }

  .name {
    font-size: var(--step-0);
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .total {
    font-size: var(--step-3);
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
</style>
