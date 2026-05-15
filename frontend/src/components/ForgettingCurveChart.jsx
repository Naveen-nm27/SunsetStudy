import { useMemo } from 'react';
import moment from 'moment';
import { topicIdFromSession } from '../utils/topic';

const TAU_DAYS = 5;
const PAD = { top: 24, right: 28, bottom: 44, left: 52 };
const W = 720;
const H = 320;

function startOfDayMs(d) {
  return moment(d).startOf('day').valueOf();
}

function retentionAfterGap(daysSince) {
  return Math.max(0, Math.min(100, 100 * Math.exp(-daysSince / TAU_DAYS)));
}

function buildPath(points) {
  if (points.length === 0) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
}

/**
 * Piecewise exponential decay: after each completed session, retention resets to 100% and decays until the next review.
 * Also draws the next scheduled review and optional selected session marker.
 */
export default function ForgettingCurveChart({ topic, sessions, selectedSessionId }) {
  const topicId = topic?._id;

  const { completions, planned, xMinMs, xMaxMs, points, markers } = useMemo(() => {
    if (!topicId) {
      return { completions: [], planned: [], xMinMs: 0, xMaxMs: 0, points: [], markers: [] };
    }

    const topicSessions = sessions.filter((s) => topicIdFromSession(s) === topicId);
    const completions = topicSessions
      .filter((s) => s.status === 'completed')
      .map((s) => ({ ...s, t: startOfDayMs(s.date) }))
      .sort((a, b) => a.t - b.t);

    const planned = topicSessions
      .filter((s) => s.status === 'planned')
      .map((s) => ({ ...s, t: startOfDayMs(s.date) }))
      .sort((a, b) => a.t - b.t);

    if (completions.length === 0) {
      return { completions: [], planned, xMinMs: 0, xMaxMs: 0, points: [], markers: [] };
    }

    const firstT = completions[0].t;
    const lastT = completions[completions.length - 1].t;
    const nextReviewMs = topic.nextReviewDate ? startOfDayMs(topic.nextReviewDate) : null;
    const lastPlanned = planned.length ? planned[planned.length - 1].t : null;

    let xMaxMs = Math.max(
      lastT,
      nextReviewMs || 0,
      lastPlanned || 0,
      moment().startOf('day').valueOf()
    );
    xMaxMs = moment(xMaxMs).add(14, 'days').valueOf();

    const xMinMs = moment(firstT).subtract(2, 'days').valueOf();
    const span = Math.max(1, xMaxMs - xMinMs);

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const xScale = (ms) => PAD.left + ((ms - xMinMs) / span) * innerW;
    const yScale = (pct) => PAD.top + innerH * (1 - pct / 100);

    const pts = [];
    const stepMs = 36e5 * 6;
    for (let t = xMinMs; t <= xMaxMs; t += stepMs) {
      let lastComp = null;
      for (const c of completions) {
        if (c.t <= t) lastComp = c.t;
        else break;
      }
      if (lastComp === null) {
        pts.push({ x: xScale(t), y: yScale(100), t });
        continue;
      }
      const daysSince = (t - lastComp) / 86400000;
      const r = retentionAfterGap(daysSince);
      pts.push({ x: xScale(t), y: yScale(r), t });
    }

    const markers = [];

    completions.forEach((c) => {
      markers.push({
        kind: 'done',
        t: c.t,
        x: xScale(c.t),
        y: yScale(100),
        label: moment(c.t).format('MMM D'),
        id: c._id,
      });
    });

    if (nextReviewMs) {
      const lastComp = completions[completions.length - 1].t;
      const daysSince = (nextReviewMs - lastComp) / 86400000;
      markers.push({
        kind: 'next',
        t: nextReviewMs,
        x: xScale(nextReviewMs),
        y: yScale(retentionAfterGap(daysSince)),
        label: `Review ${moment(nextReviewMs).format('MMM D')}`,
      });
    }

    if (selectedSessionId) {
      const sel = topicSessions.find((s) => s._id === selectedSessionId);
      if (sel) {
        const st = startOfDayMs(sel.date);
        let lastComp = null;
        for (const c of completions) {
          if (c.t <= st) lastComp = c.t;
          else break;
        }
        if (lastComp !== null) {
          const daysSince = (st - lastComp) / 86400000;
          markers.push({
            kind: 'selected',
            t: st,
            x: xScale(st),
            y: yScale(retentionAfterGap(daysSince)),
            label: moment(st).format('MMM D'),
          });
        }
      }
    }

    return {
      completions,
      planned,
      xMinMs,
      xMaxMs,
      points: pts,
      markers,
    };
  }, [topic, topicId, sessions, selectedSessionId]);

  if (!topicId) return null;

  if (completions.length === 0) {
    return (
      <div className="fun-card p-10 text-center">
        <p className="font-serif text-lg text-text-main mb-2">No completed sessions yet</p>
        <p className="font-mono text-sm text-text-muted uppercase tracking-wide max-w-md mx-auto leading-relaxed">
          Complete at least one study session for this topic. The curve shows how memory decays between reviews and
          where your next review lands.
        </p>
      </div>
    );
  }

  const pathD = buildPath(points);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const yTicks = [100, 75, 50, 25, 0];
  const xLabelY = H - 8;

  return (
    <div className="fun-card p-4 md:p-6 w-full overflow-x-auto">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-serif font-bold text-sunset-orange">Forgetting curve</h3>
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted mt-1 leading-relaxed">
            Model: exponential decay (τ = {TAU_DAYS}d) between completed sessions — illustrative, not clinical.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 font-mono text-xs uppercase text-text-muted leading-relaxed">
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-sunset-pink" /> Completed
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-sunset-yellow" /> Next review
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-sunset-orange border-2 border-bg-base" /> Selected session
          </span>
        </div>
      </div>

      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="text-text-main"
        role="img"
        aria-label="Forgetting curve for topic retention over time"
      >
        <defs>
          <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--c-pink)" />
            <stop offset="100%" stopColor="var(--c-orange)" />
          </linearGradient>
        </defs>

        <line
          x1={PAD.left}
          y1={PAD.top}
          x2={PAD.left}
          y2={H - PAD.bottom}
          stroke="currentColor"
          strokeWidth="1.5"
          className="opacity-25"
        />
        <line
          x1={PAD.left}
          y1={H - PAD.bottom}
          x2={W - PAD.right}
          y2={H - PAD.bottom}
          stroke="currentColor"
          strokeWidth="1.5"
          className="opacity-25"
        />

        {yTicks.map((pct) => {
          const y = PAD.top + innerH * (1 - pct / 100);
          return (
            <g key={pct}>
              <line
                x1={PAD.left}
                y1={y}
                x2={W - PAD.right}
                y2={y}
                stroke="currentColor"
                strokeDasharray="4 6"
                className="opacity-10"
              />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="fill-current opacity-45 font-mono text-[11px]">
                {pct}%
              </text>
            </g>
          );
        })}

        <path d={pathD} fill="none" stroke="url(#curveGrad)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

        {[0, 0.25, 0.5, 0.75, 1].map((r) => {
          const ms = xMinMs + (xMaxMs - xMinMs) * r;
          const x = PAD.left + innerW * r;
          return (
            <text key={r} x={x} y={xLabelY} textAnchor="middle" className="fill-current opacity-45 font-mono text-[10px]">
              {moment(ms).format('MMM D')}
            </text>
          );
        })}

        {markers.map((m, i) => {
          if (m.kind === 'next') {
            return (
              <g key={`m-${i}`}>
                <line
                  x1={m.x}
                  y1={PAD.top}
                  x2={m.x}
                  y2={H - PAD.bottom}
                  stroke="var(--c-yellow)"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  opacity="0.85"
                />
                <circle cx={m.x} cy={m.y} r="6" fill="var(--c-yellow)" stroke="var(--c-bg)" strokeWidth="2" />
              </g>
            );
          }
          if (m.kind === 'selected') {
            return (
              <circle
                key={`m-${i}`}
                cx={m.x}
                cy={m.y}
                r="8"
                fill="var(--c-orange)"
                stroke="var(--c-bg)"
                strokeWidth="2"
              />
            );
          }
          return (
            <circle
              key={m.id || i}
              cx={m.x}
              cy={m.y}
              r="5"
              fill="var(--c-pink)"
              stroke="var(--c-bg)"
              strokeWidth="2"
              opacity="0.9"
            />
          );
        })}
      </svg>
    </div>
  );
}
