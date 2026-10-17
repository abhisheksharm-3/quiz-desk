<!-- Stage for Buzzer rounds: first team to buzz answers, a wrong answer locks that team out until the question ends. -->
<script lang="ts">
  import Button from '../../components/Button.svelte';
  import { buzzerReducer, type BuzzerAction, type BuzzerState } from '../../lib/domain/buzzer';
  import { nextQuestion } from '../../lib/domain/questions';
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

  $effect(() => {
    if (stopsClock) countdown.pause();
  });

  function send(action: BuzzerAction): void {
    buzzer = buzzerReducer(buzzer, action, quiz.teams.length);
  }

  async function start(): Promise<void> {
    if (buzzer.phase !== 'idle' || !question) return;
    send({ type: 'start', questionId: question.id });
    awarded = 0;
    await stage.begin(question, () => buzzer.phase === 'countdown', () => send({ type: 'countdownDone' }));
  }

  function buzz(team: number): void {
    if (buzzer.phase !== 'open') return;
    send({ type: 'buzz', team });
  }

  function right(points: Points): void {
    if (buzzer.phase !== 'answering') return;
    stage.record(buzzer.team, buzzer.questionId, points);
    awarded = points;
    sound.right();
    send({ type: 'right' });
  }

  function wrong(points: Points): void {
    if (buzzer.phase !== 'answering') return;
    if (points !== 0) stage.record(buzzer.team, buzzer.questionId, points);
    awarded = points;
    sound.wrong();
    send({ type: 'wrong' });
  }

  function end(): void {
    send({ type: 'end' });
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
          { key: 'r', keyLabel: 'R', text: 'Right +5', disabled: false, run: () => right(5) },
          { key: 'backspace', keyLabel: 'Backspace', text: 'Wrong −5', variant: 'danger', disabled: false, run: () => wrong(-5) },
          { key: 'w', keyLabel: 'W', text: 'Wrong −10', variant: 'danger', disabled: false, run: () => wrong(-10) },
          { key: 'n', keyLabel: 'N', text: 'Wrong, no penalty', disabled: false, run: () => wrong(0) },
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
    stage.undoCommand(),
    stage.muteCommand(),
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
  status={status ?? stage.notice}
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
