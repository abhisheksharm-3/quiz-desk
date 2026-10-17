<!-- Control bar: the actions that apply right now as large buttons, a team picker before a question, and a More menu for the rest. -->
<script module lang="ts">
  export interface Command {
    key: string;
    keyLabel: string;
    text: string;
    variant?: 'primary' | 'quiet' | 'danger';
    slot?: 'bar';
    hidden?: boolean;
    disabled: boolean;
    run: () => void;
  }

  export interface TeamPicker {
    teams: string[];
    current: number;
    onpick: (index: number) => void;
  }
</script>

<script lang="ts">
  import Button from '../../components/Button.svelte';
  import Kbd from '../../components/Kbd.svelte';
  import Menu from '../../components/Menu.svelte';

  let { commands, picker = null }: { commands: Command[]; picker?: TeamPicker | null } = $props();

  const available = $derived(commands.filter((candidate) => !candidate.hidden && !candidate.disabled));
  const barCommands = $derived(available.filter((candidate) => candidate.slot === 'bar'));
  const moreItems = $derived(
    available
      .filter((candidate) => candidate.slot !== 'bar')
      .map((candidate) => ({
        text: candidate.text,
        hint: candidate.keyLabel,
        danger: candidate.variant === 'danger',
        run: candidate.run,
      })),
  );
</script>

<div class="bar" role="group" aria-label="Quiz controls">
  {#each barCommands as command (command.key)}
    <Button type="button" size="large" variant={command.variant} onclick={command.run}>
      {command.text}
      <Kbd key={command.keyLabel} />
    </Button>
  {/each}
  {#if picker}
    <Menu
      label="Change team"
      align="start"
      items={picker.teams.map((team, index) => ({
        text: team,
        current: index === picker.current,
        run: () => picker.onpick(index),
      }))}
    >
      {#snippet trigger()}{picker.teams[picker.current]} is up · change{/snippet}
    </Menu>
  {/if}
  {#if moreItems.length > 0}
    <Menu label="More controls" items={moreItems}>
      {#snippet trigger()}More{/snippet}
    </Menu>
  {/if}
</div>

<style>
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    min-height: var(--control-large);
  }
</style>
