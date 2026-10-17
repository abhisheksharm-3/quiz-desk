/** Logic every round stage shares: the countdown, recording and undoing scores, starting a question, and the mute command. */

import { onDestroy } from 'svelte';
import { addScore, canUndoScore, markAsked, undoLastScore } from '../../lib/domain/quiz';
import type { Points, Question, Quiz, Round } from '../../lib/domain/types';
import * as sound from '../../lib/sound';
import { app, commit } from '../../lib/store.svelte';
import { createCountdown } from '../../lib/timer.svelte';
import type { Command } from './ControlBar.svelte';

const UNDO_KEY_LABEL = /Mac/.test(navigator.userAgent) ? '⌘Z' : 'Ctrl+Z';

function formatPoints(points: Points): string {
  return points < 0 ? `−${-points}` : `+${points}`;
}

/** Must run during component initialisation, because the countdown pauses when the stage is destroyed. */
export function createStageActions(quiz: () => Quiz, round: () => Round) {
  const countdown = createCountdown(0, (cue) => {
    if (cue === 'beep') sound.beep();
    else sound.wrong();
  });
  let notice = $state<string | null>(null);

  onDestroy(() => countdown.pause());

  function record(teamIndex: number, questionId: string, points: Points): void {
    const teamId = quiz().teams[teamIndex].id;
    commit(() => addScore(quiz(), { roundId: round().id, teamId, questionId, points }, Date.now()));
  }

  /** Marks the question asked, runs the start tone, then calls onReady and starts the clock unless the stage left the countdown. */
  async function begin(asked: Question, isCountingDown: () => boolean, onReady: () => void): Promise<void> {
    notice = null;
    commit(() => markAsked(quiz(), asked.id, Date.now()));
    countdown.reset(round().timerSeconds);
    await sound.startTone();
    if (!isCountingDown()) return;
    onReady();
    countdown.start();
  }

  /** Removes the newest score of this round and reports what went. Returns false when this round has none to remove. */
  function undo(): boolean {
    const last = quiz().scores.at(-1);
    if (!last || !canUndoScore(quiz(), round().id)) return false;
    commit(() => undoLastScore(quiz(), round().id));
    const team = quiz().teams.find((candidate) => candidate.id === last.teamId);
    notice = `Removed ${team?.name ?? 'team'} ${formatPoints(last.points)}`;
    return true;
  }

  function toggleMute(): void {
    commit((data) => (data.muted = !data.muted));
  }

  return {
    countdown,
    record,
    begin,
    undo,
    get notice() {
      return notice;
    },
    undoCommand: (): Command => ({
      key: 'z',
      keyLabel: UNDO_KEY_LABEL,
      text: 'Undo score',
      disabled: !canUndoScore(quiz(), round().id),
      run: undo,
    }),
    muteCommand: (): Command => ({
      key: 'm',
      keyLabel: 'M',
      text: app.muted ? 'Unmute' : 'Mute',
      disabled: false,
      run: toggleMute,
    }),
  };
}
