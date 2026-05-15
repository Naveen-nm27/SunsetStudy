import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useConfirm } from './ConfirmProvider';

function parseTimeToSeconds(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return 0;
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 3600 + m * 60;
}

function formatCountdown(sec) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

/** Study timer for a planned session: duration from start–end window, or 25m default. */
export default function SessionStudyTimer({ session, onComplete }) {
  const confirm = useConfirm();
  const totalSec = useMemo(() => {
    const start = parseTimeToSeconds(session.startTime);
    const end = parseTimeToSeconds(session.endTime);
    let d = end - start;
    if (d <= 0) d = 25 * 60;
    return Math.min(Math.max(d, 60), 24 * 3600);
  }, [session.startTime, session.endTime]);

  const [remaining, setRemaining] = useState(totalSec);
  const [phase, setPhase] = useState('idle');
  const intervalRef = useRef(null);
  const finishedRef = useRef(false);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTick(), [clearTick]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTick();
    setRemaining(0);
    setPhase('done');
    onComplete?.();
  }, [clearTick, onComplete]);

  useEffect(() => {
    if (phase !== 'running') return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          finish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTick();
  }, [phase, finish, clearTick]);

  if (session.status !== 'planned') return null;

  const pct = totalSec > 0 ? Math.round(((totalSec - remaining) / totalSec) * 100) : 0;

  const onPlay = () => {
    if (phase === 'done') return;
    setPhase('running');
  };

  const onPause = () => {
    clearTick();
    setPhase('paused');
  };

  const onReset = async () => {
    const ok = await confirm('Reset the timer to the full session length? Your current progress will be lost.');
    if (!ok) return;
    clearTick();
    finishedRef.current = false;
    setRemaining(totalSec);
    setPhase('idle');
  };

  return (
    <div className="mt-2 pt-2 border-t border-border-color/60 space-y-2 text-left max-w-xs">
      <div className="flex items-center justify-between gap-2 font-mono text-xs uppercase text-text-muted">
        <span>Study timer</span>
        <span className="text-sunset-orange font-bold tabular-nums">{phase === 'done' ? '0:00' : formatCountdown(remaining)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-base border border-border-color overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-sunset-pink to-sunset-orange transition-[width] duration-300 ease-linear"
          style={{ width: `${phase === 'done' ? 100 : pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {phase !== 'running' && phase !== 'done' && (
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sunset-orange/20 text-sunset-orange text-xs font-mono uppercase font-bold hover:opacity-90"
            onClick={onPlay}
          >
            <Play size={12} /> Play
          </button>
        )}
        {phase === 'running' && (
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sunset-yellow/25 text-sunset-deep dark:text-sunset-yellow text-xs font-mono uppercase font-bold hover:opacity-90"
            onClick={onPause}
          >
            <Pause size={12} /> Pause
          </button>
        )}
        {phase === 'paused' && (
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sunset-orange/20 text-sunset-orange text-xs font-mono uppercase font-bold hover:opacity-90"
            onClick={onPlay}
          >
            <Play size={12} /> Resume
          </button>
        )}
        {phase !== 'done' && (
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border-color text-text-muted text-xs font-mono uppercase font-bold hover:border-sunset-pink hover:text-sunset-pink"
            onClick={onReset}
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
        {phase === 'done' && <span className="text-xs font-mono uppercase text-sunset-orange font-bold">Session time complete</span>}
      </div>
    </div>
  );
}
