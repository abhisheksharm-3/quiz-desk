<!-- Stage for Standard and Picture rounds: wires the turn reducer to the timer, sounds, scores and keys. -->
<script lang="ts">
  import Button from '../../components/Button.svelte';
  import { nextQuestion } from '../../lib/domain/questions';
  import { suggestedPoints, turnReducer, type TurnAction, type TurnState } from '../../lib/domain/turn';
  import type { Points, Quiz, Round } from '../../lib/domain/types';
  import * as sound from '../../lib/sound';
  import type { Command } from './ControlBar.svelte';
  import QuestionCard from './QuestionCard.svelte';
  import { createStageActions } from './stageActions.svelte';
  import StageFrame from './StageFrame.svelte';
  import Timer from './Timer.svelte';

  let { quiz, round, onback }: { quiz: Quiz; round: Round; onback: () => void } = $props();

  const stage = createStageActions(() => quiz, () => round);
  const { countdown } = stage;
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

  function send(action: TurnAction): void {
    turn = turnReducer(turn, action, quiz.teams.length);
  }

  function finish(): void {
    countdown.pause();
  }

  async function start(): Promise<void> {
    if (turn.phase !== 'idle' || !question) return;
    send({ type: 'start', questionId: question.id });
    await stage.begin(question, () => turn.phase === 'countdown', () => send({ type: 'countdownDone' }));
  }

  function right(points: Points): void {
    if (turn.phase !== 'asking') return;
    finish();
    stage.record(turn.team, turn.questionId, points);
    sound.right();
    send({ type: 'right', points });
  }

  function pass(): void {
    send({ type: 'pass' });
    if (turn.phase === 'result') {
      finish();
      sound.wrong();
      return;
    }
    countdown.reset(round.timerSeconds);
    countdown.start();
  }

  function end(): void {
    send({ type: 'end' });
    finish();
  }

  function penalty(points: Points): void {
    if ((turn.phase !== 'asking' && turn.phase !== 'result') || turn.team === null) return;
    stage.record(turn.team, turn.questionId, points);
    sound.wrong();
  }

  function undo(): void {
    if (!stage.undo() || turn.phase !== 'result') return;
    const { questionId } = turn;
    const stillAwarded = quiz.scores.some((score) => score.questionId === questionId && score.points > 0);
    if (!stillAwarded) send({ type: 'reopen' });
  }

  const commands: Command[] = $derived([
    {
      key: ' ',
      keyLabel: 'Space',
      text: turn.phase === 'result' ? 'Next question' : 'Start question',
      variant: 'primary',
      slot: 'bar',
      disabled: turn.phase === 'result' ? false : turn.phase !== 'idle' || !question,
      run: () => (turn.phase === 'result' ? send({ type: 'next' }) : void start()),
    },
    { key: '1', keyLabel: '1', text: '✓ Right +10', variant: 'primary', slot: suggested === 10 ? 'bar' : undefined, disabled: turn.phase !== 'asking', run: () => right(10) },
    { key: '2', keyLabel: '2', text: '✓ Right +5', variant: 'primary', slot: suggested === 5 ? 'bar' : undefined, disabled: turn.phase !== 'asking', run: () => right(5) },
    { key: 'p', keyLabel: 'P', text: 'Pass →', slot: 'bar', disabled: turn.phase !== 'asking', run: pass },
    { key: 'e', keyLabel: 'E', text: '✗ Wrong', variant: 'danger', slot: 'bar', disabled: turn.phase !== 'asking', run: end },
    { key: '3', keyLabel: '3', text: 'Penalty −5', variant: 'danger', disabled: scoringTeam === null, run: () => penalty(-5) },
    { key: '4', keyLabel: '4', text: 'Penalty −10', variant: 'danger', disabled: scoringTeam === null, run: () => penalty(-10) },
    { ...stage.undoCommand(), run: undo },
    stage.muteCommand(),
    { key: 'escape', keyLabel: 'Esc', text: 'Back to rounds', disabled: turn.phase === 'asking' || turn.phase === 'countdown', run: onback },
  ]);

  const asked = $derived(round.questions.filter((candidate) => candidate.askedAt !== null).length);
</script>

<StageFrame {quiz} {round} {commands} current={currentTeam} pickable={turn.phase === 'idle'} status={stage.notice} onpick={(team) => send({ type: 'pickTeam', team })}>
  {#snippet timer()}
    {#if turn.phase !== 'idle'}
      <Timer left={countdown.left} total={round.timerSeconds} />
    {/if}
  {/snippet}
  {#if turn.phase === 'idle' && !question}
    <div class="notice">
      <h2>No questions left in this round</h2>
      <Button type="button" variant="primary" size="large" onclick={onback}>Back to rounds</Button>
    </div>
  {:else if turn.phase === 'idle'}
    <div class="notice">
      <h2>{quiz.teams[turn.nextTeam].name} is up</h2>
      <p>Question {asked + 1} of {round.questions.length}</p>
    </div>
  {:else if turn.phase === 'countdown'}
    <div class="notice">
      <h2>Get ready, {quiz.teams[turn.team].name}</h2>
    </div>
  {:else if shown}
    <QuestionCard question={shown} mode={quiz.languageMode} {result} />
  {/if}
</StageFrame>

