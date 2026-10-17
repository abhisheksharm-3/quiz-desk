<!-- A visible label wrapped around one native control. -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let { label, children }: { label: string; children: Snippet } = $props();
</script>

<label>
  <span>{label}</span>
  {@render children()}
</label>

<style>
  label {
    display: grid;
    gap: var(--space-1);
  }

  span {
    font-size: var(--step-0);
    font-weight: 600;
    color: var(--muted);
  }
</style>
