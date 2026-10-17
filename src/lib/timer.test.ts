import { describe, expect, it } from 'vitest';
import { countdownCue } from './timer.svelte';

describe('countdownCue', () => {
  it.each([
    [11.2, 10.9, null],
    [10.2, 9.9, 'beep'],
    [10.4, 10.1, null],
    [1.1, 0.9, 'beep'],
    [0.3, 0, 'end'],
    [25.0, 24.5, null],
  ] as const)('from %s to %s gives %s', (prevLeft, left, expected) => {
    expect(countdownCue(prevLeft, left)).toBe(expected);
  });
});
