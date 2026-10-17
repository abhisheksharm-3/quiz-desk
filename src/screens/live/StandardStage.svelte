<!-- Stage for Standard and Picture rounds: wires the turn reducer to the timer, sounds, scores and keys. -->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import Button from '../../components/Button.svelte';
  import { nextQuestion } from '../../lib/domain/questions';
  import { addScore, markAsked, undoLastScore } from '../../lib/domain/quiz';
  import { suggestedPoints, turnReducer, type TurnAction, type TurnState } from '../../lib/domain/turn';
  import type { Points, Quiz, Round } from '../../lib/domain/types';
  import * as sound from '../../lib/sound';
  import { app, commit } from '../../lib/store.svelte';
  import { createCountdown } from '../../lib/timer.svelte';
  import ControlBar, { type Command } from './ControlBar.svelte';
  import QuestionCard from './QuestionCard.svelte';
  import TeamStrip from './TeamStrip.svelte';
  import Timer from './Timer.svelte';

  let { quiz, round, onback }: { quiz: Quiz; round: Round; onback: () => void } = $props();

  const UNDO_KEY_LABEL = /Mac/.test(navigator.userAgent) ? '⌘Z' : 'Ctrl+Z';

  const countdown = createCountdown(0, (cue) => {
    if (cue === 'beep') sound.beep();
    else sound.wrong();
  });
  let turn = $state<TurnState>({ phase: 'idle', nextTeam: 0 });

  const question = $derived(nextQuestion(round));
  const shown = $derived.by(() => {
    if (turn.phase === 'idle') return null;
    const { questionId } = turn;
    return round.questions.find((candidate) => candidate.id === questionId) ?? null;
  });
  const totals = $derived(
    quiz.teams.map((team) =>
      quiz.scores.filter((score) => score.teamId === team.id).reduce((sum, score) => sum + score.points, 0),
    ),
  );
  const currentTeam = $derived(turn.phase === 'idle' ? turn.nextTeam : turn.team);
  const scoringTeam = $derived(turn.phase === 'asking' || turn.phase === 'result' ? turn.team : null);
  const result = $derived(
    turn.phase === 'result'
      ? {
          correct: turn.correct,
          teamName: turn.team === null ? null : quiz.teams[turn.team].name,
          points: turn.points,
        }
      : null,
  );
  const suggested = $derived(turn.phase === 'asking' ? suggestedPoints(turn) : null);

  onDestroy(() => countdown.pause());

  function send(action: TurnAction): void {
    turn = turnReducer(turn, action, quiz.teams.length);
  }

  function record(teamIndex: number, questionId: string, points: Points): void {
    commit(() =>
      addScore(quiz, { roundId: round.id, teamId: quiz.teams[teamIndex].id, questionId, points }, Date.now()),
    );
  }

  function finish(): void {
    countdown.pause();
  }

  async function start(): Promise<void> {
    if (turn.phase !== 'idle' || !question) return;
    const asked = question;
    send({ type: 'start', questionId: asked.id });
    commit(() => markAsked(quiz, asked.id, Date.now()));
    countdown.reset(round.timerSeconds);
    await sound.startTone();
    if (!isCountingDown()) return;
    send({ type: 'countdownDone' });
    countdown.start();
  }

  function isCountingDown(): boolean {
    return turn.phase === 'countdown';
  }

  function right(points: Points): void {
    if (turn.phase !== 'asking') return;
    finish();
    record(turn.team, turn.questionId, points);
    sound.right();
    send({ type: 'right', points });
  }

  function pass(): void {
    send({ type: 'pass' });
    if (turn.phase !== 'result') return;
    finish();
    sound.wrong();
  }

  function end(): void {
    send({ type: 'end' });
    finish();
  }

  function penalty(points: Points): void {
    if ((turn.phase !== 'asking' && turn.phase !== 'result') || turn.team === null) return;
    record(turn.team, turn.questionId, points);
    sound.wrong();
  }

  function undo(): void {
    commit(() => undoLastScore(quiz));
  }

  function toggleMute(): void {
    commit((data) => (data.muted = !data.muted));
  }

  const commands: Command[] = $derived([
    {
      key: ' ',
      keyLabel: 'Space',
      text: turn.phase === 'result' ? 'Next question' : 'Start',
      variant: 'primary',
      disabled: turn.phase === 'result' ? false : turn.phase !== 'idle' || !question,
      run: () => (turn.phase === 'result' ? send({ type: 'next' }) : void start()),
    },
    { key: '1', keyLabel: '1', text: 'Right +10', variant: suggested === 10 ? 'primary' : 'quiet', disabled: turn.phase !== 'asking', run: () => right(10) },
    { key: '2', keyLabel: '2', text: 'Right +5', variant: suggested === 5 ? 'primary' : 'quiet', disabled: turn.phase !== 'asking', run: () => right(5) },
    { key: 'p', keyLabel: 'P', text: 'Pass', disabled: turn.phase !== 'asking', run: pass },
    { key: 'e', keyLabel: 'E', text: 'End question', disabled: turn.phase !== 'asking', run: end },
    { key: '3', keyLabel: '3', text: 'Penalty −5', variant: 'danger', disabled: scoringTeam === null, run: () => penalty(-5) },
    { key: '4', keyLabel: '4', text: 'Penalty −10', variant: 'danger', disabled: scoringTeam === null, run: () => penalty(-10) },
    { key: 'z', keyLabel: UNDO_KEY_LABEL, text: 'Undo score', disabled: quiz.scores.length === 0, run: undo },
    { key: 'm', keyLabel: 'M', text: app.muted ? 'Unmute' : 'Mute', disabled: false, run: toggleMute },
    { key: 'escape', keyLabel: 'Esc', text: 'Round board', disabled: turn.phase === 'asking' || turn.phase === 'countdown', run: onback },
  ]);

  function onKeydown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const chord = event.metaKey || event.ctrlKey;
    if (event.repeat || event.altKey || chord !== (key === 'z')) return;
    const command = commands.find((candidate) => candidate.key === key);
    if (!command) return;
    event.preventDefault();
    if (!command.disabled) command.run();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<main class="stage">
  <header>
    <h1>{quiz.title}</h1>
    <p class="round">{round.name}</p>
    {#if quiz.quizMasters}<p class="masters">Quiz master {quiz.quizMasters}</p>{/if}
  </header>

  <section class="body" aria-live="off">
    {#if turn.phase === 'idle' && !question}
      <div class="notice">
        <h2>No questions left in this round</h2>
        <Button type="button" variant="primary" onclick={onback}>Back to round board</Button>
      </div>
    {:else if turn.phase === 'idle'}
      <div class="notice">
        <h2>{quiz.teams[turn.nextTeam].name} is up</h2>
        <p>{round.questions.filter((candidate) => candidate.askedAt === null).length} of {round.questions.length} left</p>
      </div>
    {:else if turn.phase === 'countdown'}
      <div class="notice">
        <h2>Get ready, {quiz.teams[turn.team].name}</h2>
      </div>
    {:else if shown}
      <QuestionCard question={shown} mode={quiz.languageMode} {result} />
    {/if}
    {#if turn.phase !== 'idle'}
      <Timer left={countdown.left} total={round.timerSeconds} />
    {/if}
  </section>

  <TeamStrip
    teams={quiz.teams}
    {totals}
    current={currentTeam}
    pickable={turn.phase === 'idle'}
    onpick={(team) => send({ type: 'pickTeam', team })}
  />
  <ControlBar {commands} />
</main>

<style>
  .stage {
    display: grid;
    grid-template-rows: auto 1fr auto auto;
    gap: var(--space-4);
    height: 100dvh;
    padding: var(--safe-y) var(--safe-x);
  }

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-1) var(--space-4);
  }

  h1 {
    font-size: var(--step-2);
  }

  .round {
    padding: 0 var(--space-3);
    border-radius: var(--radius-pill);
    background: var(--accent-bg);
    color: var(--accent-fg);
    font-size: var(--step-1);
    font-weight: 600;
  }

  .masters {
    margin-inline-start: auto;
    color: var(--muted);
  }

  .body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: var(--space-5);
    min-height: 0;
    overflow-y: auto;
  }

  .body > :global(.card) {
    height: 100%;
  }

  .notice {
    display: grid;
    gap: var(--space-3);
    justify-items: start;
    align-self: center;
  }

  .notice h2 {
    font-size: var(--step-5);
    font-weight: 800;
  }

  .notice p {
    color: var(--muted);
    font-size: var(--step-1);
  }
</style>
