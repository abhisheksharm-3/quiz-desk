/** Quiz sounds generated with Web Audio, so the app needs no audio files and stays offline. */

const BEEP_HZ = 880;
const PIP_HZ = [440, 523, 659];
const LONG_TONE_HZ = 880;
const START_TONE_MS = 3000;

let context: AudioContext | null = null;
let muted = false;

function audio(): AudioContext {
  context ??= new AudioContext();
  return context;
}

function tone(hz: number, startOffset: number, duration: number, volume = 0.3): void {
  if (muted) return;
  const ctx = audio();
  const start = ctx.currentTime + startOffset;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.frequency.value = hz;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

export function setMuted(value: boolean): void {
  muted = value;
}

/** Three rising pips at 0, 1 and 2 seconds, then a long tone. Resolves after 3 seconds even when muted. */
export function startTone(): Promise<void> {
  PIP_HZ.forEach((hz, second) => tone(hz, second, 0.2));
  tone(LONG_TONE_HZ, 2, 1, 0.35);
  return new Promise((resolve) => setTimeout(resolve, START_TONE_MS));
}

export function beep(): void {
  tone(BEEP_HZ, 0, 0.12, 0.4);
}

export function right(): void {
  tone(523, 0, 0.15);
  tone(784, 0.15, 0.3);
}

export function wrong(): void {
  tone(196, 0, 0.5, 0.35);
}
