<!-- Stage for Rapid fire rounds: one team at a time answers as many questions as it can in its clock, +1 right and -1 wrong. -->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import Button from '../../components/Button.svelte';
  import { answerLines, nextQuestion } from '../../lib/domain/questions';
  import { addScore, markAsked } from '../../lib/domain/quiz';
  import { rapidReducer, type RapidAction, type RapidState } from '../../lib/domain/rapid';
  import type { Points, Quiz, Round } from '../../lib/domain/types';
  import * as sound from '../../lib/sound';
  import { app, commit } from '../../lib/store.svelte';
  import { createCountdown } from '../../lib/timer.svelte';
  import type { Command } from './ControlBar.svelte';
  import QuestionCard from './QuestionCard.svelte';
  import StageFrame from './StageFrame.svelte';
  import Timer from './Timer.svelte';

  let { quiz, round, onback }: { quiz: Quiz; round: Round; onback: () => void } = $props();

  const countdown = createCountdown(0, (cue) => {
    if (cue === 'beep') sound.beep();
    else sound.wrong();
  });
  let rapid = $state<RapidState>({ phase: 'ready', team: 0 });
  let starting = $state(false);
  let previous = $state<{ questionId: string; correct: boolean } | null>(null);

  const question = $derived(nextQuestion(round));
  const shown = $derived.by(() => {
    if (rapid.phase !== 'running') return null;
    const { questionId } = rapid;
    return round.questions.find((candidate) => candidate.id === questionId) ?? null;
  });
  const previousQuestion = $derived(round.questions.find((candidate) => candidate.id === previous?.questionId) ?? null);
  const previousAnswer = $derived(previousQuestion ? answerLines(previousQuestion, quiz.languageMode) : null);
  const isLastTeam = $derived(rapid.team >= quiz.teams.length - 1);
  const tally = $derived(rapid.phase === 'ready' ? null : { right: rapid.right, wrong: rapid.wrong });
  const timeIsUp = $derived(rapid.phase === 'running' && countdown.left <= 0);

  onDestroy(() => countdown.pause());

  $effect(() => {
    if (timeIsUp) send({ type: 'timeUp' });
  });

  function send(action: RapidAction): void {
    rapid = rapidReducer(rapid, action);
    if (rapid.phase === 'done') countdown.pause();
  }

  async function start(): Promise<void> {
    if (rapid.phase !== 'ready' || starting || !question) return;
    const first = question;
    starting = true;
    previous = null;
    countdown.reset(round.timerSeconds);
    await sound.startTone();
    starting = false;
    commit(() => markAsked(quiz, first.id, Date.now()));
    send({ type: 'start', questionId: first.id });
    countdown.start();
  }

  function mark(correct: boolean): void {
    if (rapid.phase !== 'running') return;
    const answered = rapid.questionId;
    const points: Points = correct ? 1 : -1;
    commit(() =>
      addScore(quiz, { roundId: round.id, teamId: quiz.teams[rapid.team].id, questionId: answered, points }, Date.now()),
    );
    previous = { questionId: answered, correct };
    if (correct) sound.right();
    else sound.wrong();
    const following = nextQuestion(round);
    if (following) commit(() => markAsked(quiz, following.id, Date.now()));
    send({ type: correct ? 'right' : 'wrong', nextId: following?.id ?? null });
  }

  function nextTeam(): void {
    previous = null;
    send({ type: 'nextTeam', team: rapid.team + 1 });
  }

  function toggleMute(): void {
    commit((data) => (data.muted = !data.muted));
  }

  const commands: Command[] = $derived([
    {
      key: ' ',
      keyLabel: 'Space',
      text: rapid.phase === 'done' ? (isLastTeam ? 'Round board' : 'Next team') : 'Start',
      variant: 'primary',
      disabled: rapid.phase === 'running' || starting || (rapid.phase === 'ready' && !question),
      run: () => {
        if (rapid.phase === 'ready') void start();
        else if (isLastTeam) onback();
        else nextTeam();
      },
    },
    { key: 'arrowright', keyLabel: '→', text: 'Right +1', variant: 'primary', disabled: rapid.phase !== 'running', run: () => mark(true) },
    { key: 'arrowleft', keyLabel: '←', text: 'Wrong −1', variant: 'danger', disabled: rapid.phase !== 'running', run: () => mark(false) },
    { key: 'm', keyLabel: 'M', text: app.muted ? 'Unmute' : 'Mute', disabled: false, run: toggleMute },
    { key: 'escape', keyLabel: 'Esc', text: 'Round board', disabled: rapid.phase === 'running' || starting, run: onback },
  ]);
</script>

<StageFrame {quiz} {round} {commands} current={rapid.team} pickable={false} onpick={() => {}}>
  {#if rapid.phase === 'ready' && !question}
    <div class="notice">
      <h2>No questions left in this round</h2>
      <Button type="button" variant="primary" onclick={onback}>Back to round board</Button>
    </div>
  {:else if rapid.phase === 'ready'}
    <div class="notice">
      <h2>{quiz.teams[rapid.team].name} is up</h2>
      <p>{starting ? 'Get ready' : `${round.timerSeconds} seconds on the clock`}</p>
    </div>
  {:else if rapid.phase === 'done'}
    <div class="notice">
      <h2>{quiz.teams[rapid.team].name} scored {rapid.right - rapid.wrong}</h2>
      <p class="tally" aria-label="{rapid.right} right, {rapid.wrong} wrong">✓ {rapid.right}&nbsp; ✗ {rapid.wrong}</p>
    </div>
  {:else if shown}
    <div class="live">
      <QuestionCard question={shown} mode={quiz.languageMode} result={null} />
      {#if previousAnswer && previous}
        <p class="previous" class:right={previous.correct}>
          <span>{previous.correct ? 'Right' : 'Wrong'}, answer</span>
          {#if previousAnswer.en}<span>{previousAnswer.en}</span>{/if}
          {#if previousAnswer.hi}<span lang="hi">{previousAnswer.hi}</span>{/if}
        </p>
      {/if}
    </div>
  {/if}
  {#if rapid.phase === 'running'}
    <div class="clock">
      <Timer left={countdown.left} total={round.timerSeconds} />
      {#if tally}
        <p class="tally" aria-label="{tally.right} right, {tally.wrong} wrong, {tally.right - tally.wrong} points">
          ✓ {tally.right}&nbsp; ✗ {tally.wrong}&nbsp; = {tally.right - tally.wrong}
        </p>
      {/if}
    </div>
  {/if}
</StageFrame>

<style>
  .live {
    display: grid;
    gap: var(--space-4);
    align-content: start;
  }

  .clock {
    display: grid;
    gap: var(--space-3);
    justify-items: center;
  }

  .tally {
    font-size: var(--step-3);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .previous {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-3);
    color: var(--wrong);
    font-size: var(--step-0);
  }

  .previous.right {
    color: var(--right);
  }

  .previous span:not(:first-child) {
    color: var(--fg);
    font-weight: 600;
  }
</style>
