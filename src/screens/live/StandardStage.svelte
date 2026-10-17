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
  import type { Command } from './ControlBar.svelte';
  import QuestionCard from './QuestionCard.svelte';
  import StageFrame from './StageFrame.svelte';
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

</script>

<StageFrame {quiz} {round} {commands} current={currentTeam} pickable={turn.phase === 'idle'} onpick={(team) => send({ type: 'pickTeam', team })}>
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
</StageFrame>

