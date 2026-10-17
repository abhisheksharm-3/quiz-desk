<!-- A keyboard key hint shown beside the action it triggers. -->
<script lang="ts">
  let { key }: { key: string } = $props();
</script>

<kbd>{key}</kbd>

<style>
  kbd {
    margin-inline-start: var(--space-2);
    padding: 0 var(--space-2);
    border: 1px solid currentColor;
    border-radius: var(--radius);
    font: inherit;
    font-size: var(--step--1);
    font-weight: 400;
    opacity: 0.8;
  }
</style>
