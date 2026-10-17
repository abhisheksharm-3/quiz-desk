<!-- Control bar: every stage command as a button that shows its key. -->
<script module lang="ts">
  export interface Command {
    key: string;
    keyLabel: string;
    text: string;
    variant?: 'primary' | 'quiet' | 'danger';
    hidden?: boolean;
    disabled: boolean;
    run: () => void;
  }
</script>

<script lang="ts">
  import Button from '../../components/Button.svelte';

  let { commands }: { commands: Command[] } = $props();
</script>

<div class="bar" role="group" aria-label="Quiz controls">
  {#each commands.filter((candidate) => !candidate.hidden) as command (command.key)}
    <Button
      type="button"
      variant={command.variant}
      disabled={command.disabled}
      onclick={command.run}
    >
      {command.text}
      <kbd>{command.keyLabel}</kbd>
    </Button>
  {/each}
</div>

<style>
  .bar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  kbd {
    margin-inline-start: var(--space-2);
    padding: 0 var(--space-2);
    border: 1px solid currentColor;
    border-radius: var(--radius);
    font: inherit;
    font-size: var(--step--1);
    font-weight: 400;
  }
</style>
