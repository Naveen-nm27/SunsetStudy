export const DEFAULT_TIMER_SETTINGS = Object.freeze({ focus: 25, shortBreak: 5, longBreak: 15, rounds: 4, autoStart: false });
export function normalizeTimerSettings(input = {}) {
  const clamp = (value, fallback, max) => Number.isFinite(Number(value)) && Number(value) >= 1 ? Math.min(max, Math.floor(Number(value))) : fallback;
  return {
    focus: clamp(input.focus, 25, 180), shortBreak: clamp(input.shortBreak, 5, 60),
    longBreak: clamp(input.longBreak, 15, 120), rounds: clamp(input.rounds, 4, 12),
    autoStart: input.autoStart === true,
  };
}
export function nextTimerPhase(timer, settings) {
  const cycles = timer.cycles + (timer.phase === 'focus' ? 1 : 0);
  const phase = timer.phase === 'focus' ? (cycles % settings.rounds === 0 ? 'longBreak' : 'shortBreak') : 'focus';
  return { ...timer, phase, cycles, running: settings.autoStart,
    remaining: settings[phase] * 60, deadline: settings.autoStart ? timer.deadline + settings[phase] * 60000 : null };
}
