<!-- Countdown ring with whole seconds; turns --wrong coloured and pulses for the last 10 seconds. -->
<script lang="ts">
  let { left, total }: { left: number; total: number } = $props();

  const RADIUS = 45;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const seconds = $derived(Math.ceil(left));
  const urgent = $derived(seconds <= 10 && left > 0);
  const dashOffset = $derived(CIRCUMFERENCE * (1 - left / total));
</script>

<div class="timer" class:urgent>
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <circle class="track" cx="50" cy="50" r={RADIUS} />
    <circle
      class="ring"
      cx="50"
      cy="50"
      r={RADIUS}
      stroke-dasharray={CIRCUMFERENCE}
      stroke-dashoffset={dashOffset}
    />
  </svg>
  <span class="seconds" role="timer" aria-label="{seconds} seconds left">{seconds}</span>
</div>

<style>
  .timer {
    position: relative;
    --size: clamp(4.5rem, 11vh, 9rem);
    width: var(--size);
    aspect-ratio: 1;
    color: var(--accent);
  }

  svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  circle {
    fill: none;
    stroke-width: 6;
  }

  .track {
    stroke: currentColor;
    opacity: 0.2;
  }

  .ring {
    stroke: currentColor;
  }

  .seconds {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: calc(var(--size) * 0.42);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .urgent {
    color: var(--wrong);
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    50% {
      transform: scale(1.06);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .urgent {
      animation: none;
    }
  }
</style>
