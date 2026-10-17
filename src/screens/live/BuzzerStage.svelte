<!-- Stage for Buzzer rounds: first team to buzz answers, a wrong answer locks that team out until the question ends. -->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import Button from '../../components/Button.svelte';
  import { buzzerReducer, type BuzzerAction, type BuzzerState } from '../../lib/domain/buzzer';
  import { nextQuestion } from '../../lib/domain/questions';
  import { addScore, markAsked, undoLastScore } from '../../lib/domain/quiz';
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
  let buzzer = $state<BuzzerState>({ phase: 'idle' });
  let awarded = $state<Points>(0);

  const question = $derived(nextQuestion(round));
  const shown = $derived.by(() => {
    if (buzzer.phase === 'idle') return null;
    const { questionId } = buzzer;
    return round.questions.find((candidate) => candidate.id === questionId) ?? null;
  });
  const answeringTeam = $derived(buzzer.phase === 'answering' ? buzzer.team : null);
  const locked = $derived(buzzer.phase === 'open' || buzzer.phase === 'answering' ? buzzer.locked : []);
  const result = $derived(
    buzzer.phase === 'result'
      ? {
          correct: buzzer.correct,
          teamName: buzzer.team === null ? null : quiz.teams[buzzer.team].name,
          points: awarded,
        }
      : null,
  );
  const status = $derived.by(() => {
    if (buzzer.phase === 'open') return 'Buzzers open';
    if (buzzer.phase === 'answering') return `${quiz.teams[buzzer.team].name} is answering`;
    return null;
  });
  const stopsClock = $derived(buzzer.phase === 'result');

  onDestroy(() => countdown.pause());

  $effect(() => {
    if (stopsClock) countdown.pause();
  });

  function send(action: BuzzerAction): void {
    buzzer = buzzerReducer(buzzer, action, quiz.teams.length);
  }

  function record(teamIndex: number, questionId: string, points: Points): void {
    commit(() =>
      addScore(quiz, { roundId: round.id, teamId: quiz.teams[teamIndex].id, questionId, points }, Date.now()),
    );
  }

  async function start(): Promise<void> {
    if (buzzer.phase !== 'idle' || !question) return;
    const asked = question;
    send({ type: 'start', questionId: asked.id });
    commit(() => markAsked(quiz, asked.id, Date.now()));
    awarded = 0;
    countdown.reset(round.timerSeconds);
    await sound.startTone();
    if (!isCountingDown()) return;
    send({ type: 'countdownDone' });
    countdown.start();
  }

  function isCountingDown(): boolean {
    return buzzer.phase === 'countdown';
  }

  function buzz(team: number): void {
    if (buzzer.phase !== 'open') return;
    send({ type: 'buzz', team });
  }

  function right(points: Points): void {
    if (buzzer.phase !== 'answering') return;
    record(buzzer.team, buzzer.questionId, points);
    awarded = points;
    sound.right();
    send({ type: 'right' });
  }

  function wrong(points: Points): void {
    if (buzzer.phase !== 'answering') return;
    if (points !== 0) record(buzzer.team, buzzer.questionId, points);
    awarded = points;
    sound.wrong();
    send({ type: 'wrong' });
  }

  function end(): void {
    send({ type: 'end' });
  }

  function undo(): void {
    commit(() => undoLastScore(quiz));
  }

  function toggleMute(): void {
    commit((data) => (data.muted = !data.muted));
  }

  const answering = $derived(buzzer.phase === 'answering');
  const teamKeys: Command[] = $derived(
    quiz.teams.map((team, index) => ({
      key: String((index + 1) % 10),
      keyLabel: String((index + 1) % 10),
      text: team.name,
      hidden: true,
      disabled: buzzer.phase !== 'open' || locked.includes(index),
      run: () => buzz(index),
    })),
  );
  const scoreCommands: Command[] = $derived(
    answering
      ? [
          { key: 'enter', keyLabel: 'Enter', text: 'Right +10', variant: 'primary', disabled: false, run: () => right(10) },
          { key: '5', keyLabel: '5', text: 'Right +5', disabled: false, run: () => right(5) },
          { key: 'backspace', keyLabel: 'Backspace', text: 'Wrong −5', variant: 'danger', disabled: false, run: () => wrong(-5) },
          { key: '1', keyLabel: '1', text: 'Wrong −10', variant: 'danger', disabled: false, run: () => wrong(-10) },
          { key: '0', keyLabel: '0', text: 'Wrong, no penalty', disabled: false, run: () => wrong(0) },
        ]
      : [],
  );

  const commands: Command[] = $derived([
    {
      key: ' ',
      keyLabel: 'Space',
      text: buzzer.phase === 'result' ? 'Next question' : 'Start',
      variant: 'primary',
      disabled: buzzer.phase === 'result' ? false : buzzer.phase !== 'idle' || !question,
      run: () => (buzzer.phase === 'result' ? send({ type: 'next' }) : void start()),
    },
    ...scoreCommands,
    { key: 'e', keyLabel: 'E', text: 'End question', disabled: buzzer.phase !== 'open' && !answering, run: end },
    { key: 'z', keyLabel: UNDO_KEY_LABEL, text: 'Undo score', disabled: quiz.scores.length === 0, run: undo },
    { key: 'm', keyLabel: 'M', text: app.muted ? 'Unmute' : 'Mute', disabled: false, run: toggleMute },
    {
      key: 'escape',
      keyLabel: 'Esc',
      text: 'Round board',
      disabled: buzzer.phase === 'open' || buzzer.phase === 'answering' || buzzer.phase === 'countdown',
      run: onback,
    },
  ]);

</script>

<StageFrame
  {quiz}
  {round}
  commands={[...commands, ...teamKeys]}
  current={answeringTeam}
  pickable={buzzer.phase === 'open'}
  {locked}
  keyed={buzzer.phase === 'open'}
  {status}
  onpick={buzz}
>
  {#if buzzer.phase === 'idle' && !question}
    <div class="notice">
      <h2>No questions left in this round</h2>
      <Button type="button" variant="primary" onclick={onback}>Back to round board</Button>
    </div>
  {:else if buzzer.phase === 'idle'}
    <div class="notice">
      <h2>Buzzer question</h2>
      <p>{round.questions.filter((candidate) => candidate.askedAt === null).length} of {round.questions.length} left</p>
    </div>
  {:else if buzzer.phase === 'countdown'}
    <div class="notice">
      <h2>Get ready</h2>
    </div>
  {:else if shown}
    <QuestionCard question={shown} mode={quiz.languageMode} {result} />
  {/if}
  {#if buzzer.phase !== 'idle'}
    <Timer left={countdown.left} total={round.timerSeconds} />
  {/if}
</StageFrame>
