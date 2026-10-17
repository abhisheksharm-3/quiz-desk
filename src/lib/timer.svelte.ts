/** Countdown timer driven by performance.now() so it does not drift, plus the pure rule for when it cues. */

export type Cue = 'beep' | 'end';

const FIRST_BEEP_SECOND = 10;

/** Beeps when the whole seconds left drop to a value from 10 to 1, and ends when time reaches 0. */
export function countdownCue(prevLeft: number, left: number): Cue | null {
  if (left <= 0) return prevLeft > 0 ? 'end' : null;
  const seconds = Math.ceil(left);
  const dropped = seconds < Math.ceil(prevLeft);
  return dropped && seconds <= FIRST_BEEP_SECOND ? 'beep' : null;
}

export interface Countdown {
  left: number;
  running: boolean;
  start(): void;
  pause(): void;
  reset(seconds?: number): void;
}

export function createCountdown(seconds: number, onCue: (cue: Cue) => void): Countdown {
  let total = seconds;
  let endAt = 0;
  let frame = 0;

  function tick(now: number): void {
    const prevLeft = countdown.left;
    countdown.left = Math.max(0, (endAt - now) / 1000);
    const cue = countdownCue(prevLeft, countdown.left);
    if (cue) onCue(cue);
    if (countdown.left === 0) countdown.running = false;
    else frame = requestAnimationFrame(tick);
  }

  function start(): void {
    if (countdown.running || countdown.left <= 0) return;
    endAt = performance.now() + countdown.left * 1000;
    countdown.running = true;
    frame = requestAnimationFrame(tick);
  }

  function pause(): void {
    cancelAnimationFrame(frame);
    countdown.running = false;
  }

  function reset(next = total): void {
    pause();
    total = next;
    countdown.left = next;
  }

  const countdown: Countdown = $state({ left: seconds, running: false, start, pause, reset });
  return countdown;
}
