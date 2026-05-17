import { useMemo, useState } from 'react';
import moment from 'moment';
import { REVIEW_INTERVAL_DAYS } from '../constants/spacedRepetition';
import { topicIdFromSession } from '../utils/topic';
import {
  formatSessionChartLabel,
  sessionChartMs,
  startOfDayMs,
} from '../utils/sessionTimeline';

const TAU_DAYS = 5;
const PAD = { top: 24, right: 28, bottom: 44, left: 52 };
const W = 720;
const H = 320;
const MAX_PROJECTED_REVIEWS = 10;

function retentionAfterGap(daysSince) {
  return Math.max(0, Math.min(100, 100 * Math.exp(-daysSince / TAU_DAYS)));
}

function buildPath(points) {
  if (points.length === 0) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
}

/** One decay segment per completed session — avoids a single flat line across the whole timeline. */
function buildDecaySegments(completions, xMaxMs, xScale, yScale, stepMs = 36e5 * 3) {
  if (!completions.length) return [];
  const segments = [];
  for (let i = 0; i < completions.length; i++) {
    const anchor = completions[i].t;
    const endT = i < completions.length - 1 ? completions[i + 1].t : xMaxMs;
    const pts = [];
    for (let t = anchor; t <= endT; t += stepMs) {
      const daysSince = (t - anchor) / 86400000;
      const r = retentionAfterGap(daysSince);
      pts.push({ x: xScale(t), y: yScale(r), t });
    }
    if (pts.length === 0 || pts[pts.length - 1].t < endT) {
      const daysSince = (endT - anchor) / 86400000;
      pts.push({ x: xScale(endT), y: yScale(retentionAfterGap(daysSince)), t: endT });
    }
    if (pts.length > 0) segments.push(buildPath(pts));
  }
  return segments;
}

/**
 * Piecewise exponential decay between completed sessions.
 * Shows scheduled planned sessions and projected future reviews from the spaced-repetition schedule.
 */
export default function ForgettingCurveChart({ topic, sessions, selectedSessionId, onScheduleReview }) {
  const [hoverInfo, setHoverInfo] = useState(null);
  const topicId = topic?._id;

  const chartModel = useMemo(() => {
    if (!topicId) {
      return { completions: [], xMinMs: 0, xMaxMs: 0, pathSegments: [], markers: [], todayRetention: null };
    }

    const topicSessions = sessions.filter((s) => topicIdFromSession(s) === topicId);
    const completions = topicSessions
      .filter((s) => s.status === 'completed')
      .map((s) => ({ ...s, t: sessionChartMs(s) }))
      .sort((a, b) => a.t - b.t);

    const plannedRaw = topicSessions
      .filter((s) => s.status === 'planned')
      .map((s) => ({ ...s, t: startOfDayMs(s.date) }))
      .sort((a, b) => a.t - b.t);

    const plannedByDay = new Map();
    plannedRaw.forEach((p) => {
      if (!plannedByDay.has(p.t)) plannedByDay.set(p.t, p);
    });

    if (completions.length === 0) {
      return { completions: [], xMinMs: 0, xMaxMs: 0, pathSegments: [], markers: [], todayRetention: null };
    }

    const firstT = completions[0].t;
    const lastT = completions[completions.length - 1].t;
    const stage = topic.reviewStage ?? 0;

    const intervalIdx = (s) => Math.min(s, REVIEW_INTERVAL_DAYS.length - 1);

    let firstReviewMs;
    if (topic.nextReviewDate) {
      firstReviewMs = startOfDayMs(topic.nextReviewDate);
      if (firstReviewMs < lastT) {
        firstReviewMs = moment(lastT).add(REVIEW_INTERVAL_DAYS[intervalIdx(stage)], 'days').startOf('day').valueOf();
      }
    } else {
      firstReviewMs = moment(lastT).add(REVIEW_INTERVAL_DAYS[intervalIdx(stage)], 'days').startOf('day').valueOf();
    }

    const projected = [];
    let sCursor = stage;
    let cursorMs = firstReviewMs;
    for (let i = 0; i < MAX_PROJECTED_REVIEWS; i++) {
      projected.push(cursorMs);
      const idx = intervalIdx(sCursor);
      cursorMs = moment(cursorMs).add(REVIEW_INTERVAL_DAYS[idx], 'days').startOf('day').valueOf();
      sCursor += 1;
    }

    const todayMs = moment().startOf('day').valueOf();
    const nextReviewMs = firstReviewMs;

    let xMinMs = moment(firstT).subtract(1, 'day').valueOf();
    let xMaxMs = moment(
      Math.max(lastT, todayMs, nextReviewMs, ...plannedRaw.map((p) => p.t), projected[0] || 0)
    )
      .add(7, 'days')
      .valueOf();

    const MAX_SPAN_MS = 42 * 86400000;
    if (xMaxMs - xMinMs > MAX_SPAN_MS) {
      xMinMs = moment(lastT).subtract(2, 'days').valueOf();
      xMaxMs = moment(Math.max(nextReviewMs, todayMs, lastT)).add(10, 'days').valueOf();
      if (completions.length > 1) {
        xMinMs = moment(firstT).subtract(1, 'day').valueOf();
        xMaxMs = Math.min(xMaxMs, moment(lastT).add(28, 'days').valueOf());
      }
    }

    const span = Math.max(1, xMaxMs - xMinMs);

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const xScale = (ms) => PAD.left + ((ms - xMinMs) / span) * innerW;
    const yScale = (pct) => PAD.top + innerH * (1 - pct / 100);

    const pathSegments = buildDecaySegments(completions, xMaxMs, xScale, yScale);

    const daysSinceLastStudy = (todayMs - lastT) / 86400000;
    const todayRetention =
      todayMs >= xMinMs && todayMs <= xMaxMs ? Math.round(retentionAfterGap(Math.max(0, daysSinceLastStudy))) : null;

    const markers = [];

    const completionsByDay = new Map();
    completions.forEach((c) => {
      const dayMs = moment(c.t).startOf('day').valueOf();
      if (!completionsByDay.has(dayMs)) completionsByDay.set(dayMs, []);
      completionsByDay.get(dayMs).push(c);
    });

    completions.forEach((c) => {
      const dayMs = moment(c.t).startOf('day').valueOf();
      const dayComps = completionsByDay.get(dayMs);
      
      let label = '';
      if (dayComps.length > 1) {
        const details = dayComps.map((dc, idx) => {
           const time = moment(dc.t).format('h:mm A');
           return `${idx + 1}. ${time} (${dc.startTime || '?'} - ${dc.endTime || '?'})`;
        }).join('\n');
        label = `Multiple sessions completed on ${moment(dayMs).format('MMM D')}:\n${details}`;
      } else {
        label = `Completed on ${moment(c.t).format('MMM D, h:mm A')}\nTime: ${c.startTime || '?'} - ${c.endTime || '?'}`;
      }

      markers.push({
        kind: 'done',
        t: c.t,
        x: xScale(c.t),
        y: yScale(100),
        label,
        id: c._id,
      });
    });

    plannedByDay.forEach((p) => {
      let lastComp = null;
      for (const c of completions) {
        if (c.t <= p.t) lastComp = c.t;
        else break;
      }
      const daysSince = lastComp !== null ? (p.t - lastComp) / 86400000 : 0;
      markers.push({
        kind: 'planned',
        t: p.t,
        x: xScale(p.t),
        y: yScale(lastComp !== null ? retentionAfterGap(daysSince) : 100),
        label: `Scheduled ${moment(p.t).format('MMM D')}`,
        sessionId: p._id,
      });
    });

    projected.forEach((ms) => {
      if (plannedByDay.has(ms)) return;
      let lastComp = null;
      for (const c of completions) {
        if (c.t <= ms) lastComp = c.t;
        else break;
      }
      const daysSince = lastComp !== null ? (ms - lastComp) / 86400000 : 0;
      markers.push({
        kind: 'projected',
        t: ms,
        x: xScale(ms),
        y: yScale(lastComp !== null ? retentionAfterGap(daysSince) : 100),
        label: `Review ${moment(ms).format('MMM D')}`,
      });
    });

    if (todayRetention !== null) {
      markers.push({
        kind: 'today',
        t: todayMs,
        x: xScale(todayMs),
        y: yScale(todayRetention),
        label: `Today · ~${todayRetention}%`,
      });
    }

    if (selectedSessionId) {
      const sel = topicSessions.find((s) => s._id === selectedSessionId);
      if (sel) {
        const st = sessionChartMs(sel);
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
            label: formatSessionChartLabel(sel, st),
          });
        }
      }
    }

    return {
      completions,
      xMinMs,
      xMaxMs,
      pathSegments,
      markers,
      todayRetention,
    };
  }, [topic, topicId, sessions, selectedSessionId]);

  const { completions, xMinMs, xMaxMs, pathSegments, markers, todayRetention } = chartModel;

  if (!topicId) return null;

  if (completions.length === 0) {
    return (
      <div className="fun-card p-10 text-center">
        <p className="font-serif text-lg text-text-main mb-2">No completed sessions yet</p>
        <p className="font-mono text-sm text-text-muted uppercase tracking-wide max-w-md mx-auto leading-relaxed">
          Complete at least one study session for this topic. The curve shows how memory decays between reviews and
          where your upcoming reviews land.
        </p>
      </div>
    );
  }

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const yTicks = [100, 75, 50, 25, 0];
  const xLabelY = H - 8;

  const handleReviewClick = (m) => {
    if (!onScheduleReview) return;
    if (m.kind === 'planned' || m.kind === 'projected') {
      onScheduleReview({ dateMs: m.t });
    }
  };

  const handleMouseEnter = (e, m) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverInfo({
      marker: m,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  return (
    <div className="fun-card p-4 md:p-6 w-full overflow-x-auto">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-serif font-bold text-sunset-orange">Forgetting curve</h3>
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted mt-1 leading-relaxed">
            Model: exponential decay (τ = {TAU_DAYS}d) after each completed session — resets to 100% on review.
            {todayRetention !== null && (
              <span className="block normal-case mt-1 text-sunset-orange">
                Estimated retention today: ~{todayRetention}%
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs uppercase text-text-muted leading-relaxed">
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-sunset-pink" /> Completed
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-sunset-yellow" /> Scheduled review
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-sunset-yellow opacity-45 border border-border-color" />{' '}
            Projected review
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-sunset-orange border-2 border-bg-base" /> Highlighted
          </span>
        </div>
      </div>
      <p className="font-mono text-[11px] uppercase text-text-muted mb-3 leading-relaxed">
        Tap a yellow dot to add another planned session on that date (existing schedule is unchanged).
      </p>

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

        {pathSegments.map((d, i) => (
          <path
            key={`seg-${i}`}
            d={d}
            fill="none"
            stroke="url(#curveGrad)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

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
          if (m.kind === 'planned') {
            return (
              <g key={`planned-${m.sessionId || i}`}>
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
                <circle
                  cx={m.x}
                  cy={m.y}
                  r="7"
                  fill="var(--c-yellow)"
                  stroke="var(--c-bg)"
                  strokeWidth="2"
                  className={onScheduleReview ? 'cursor-pointer' : ''}
                  role={onScheduleReview ? 'button' : undefined}
                  tabIndex={onScheduleReview ? 0 : undefined}
                  onClick={() => handleReviewClick(m)}
                  onMouseEnter={(e) => handleMouseEnter(e, m)}
                  onMouseLeave={handleMouseLeave}
                  onKeyDown={(e) => {
                    if (!onScheduleReview) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleReviewClick(m);
                    }
                  }}
                />
              </g>
            );
          }
          if (m.kind === 'projected') {
            return (
              <g key={`proj-${m.t}-${i}`}>
                <circle
                  cx={m.x}
                  cy={m.y}
                  r="6"
                  fill="var(--c-yellow)"
                  stroke="var(--c-bg)"
                  strokeWidth="2"
                  opacity="0.42"
                  className={onScheduleReview ? 'cursor-pointer hover:opacity-70' : ''}
                  role={onScheduleReview ? 'button' : undefined}
                  tabIndex={onScheduleReview ? 0 : undefined}
                  onClick={() => handleReviewClick(m)}
                  onMouseEnter={(e) => handleMouseEnter(e, m)}
                  onMouseLeave={handleMouseLeave}
                  onKeyDown={(e) => {
                    if (!onScheduleReview) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleReviewClick(m);
                    }
                  }}
                />
              </g>
            );
          }
          if (m.kind === 'today') {
            return (
              <g key="today-marker">
                <line
                  x1={m.x}
                  y1={PAD.top}
                  x2={m.x}
                  y2={H - PAD.bottom}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="3 5"
                  className="opacity-35"
                />
                <circle 
                  cx={m.x} 
                  cy={m.y} 
                  r="5" 
                  fill="var(--c-bg)" 
                  stroke="var(--c-orange)" 
                  strokeWidth="2" 
                  onMouseEnter={(e) => handleMouseEnter(e, m)}
                  onMouseLeave={handleMouseLeave}
                />
              </g>
            );
          }
          if (m.kind === 'selected') {
            return (
              <circle
                key={`sel-${i}`}
                cx={m.x}
                cy={m.y}
                r="8"
                fill="var(--c-orange)"
                stroke="var(--c-bg)"
                strokeWidth="2"
                onMouseEnter={(e) => handleMouseEnter(e, m)}
                onMouseLeave={handleMouseLeave}
              />
            );
          }
          return (
            <g key={m.id || `done-${i}`}>
              <circle 
                cx={m.x} 
                cy={m.y} 
                r="5" 
                fill="var(--c-pink)" 
                stroke="var(--c-bg)" 
                strokeWidth="2" 
                opacity="0.9" 
                onMouseEnter={(e) => handleMouseEnter(e, m)}
                onMouseLeave={handleMouseLeave}
              />
            </g>
          );
        })}
      </svg>

      {hoverInfo && (
        <div
          className="fixed z-50 bg-bg-elevated/95 backdrop-blur-md border border-border-color shadow-xl rounded-xl p-3 text-xs font-mono max-w-xs pointer-events-none"
          style={{
            left: hoverInfo.x,
            top: hoverInfo.y - 12,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="whitespace-pre-wrap leading-relaxed text-text-main font-medium">
            {hoverInfo.marker.label}
          </div>
          {(hoverInfo.marker.kind === 'planned' || hoverInfo.marker.kind === 'projected') && onScheduleReview && (
            <div className="mt-2 text-sunset-orange font-bold uppercase tracking-widest text-[10px]">
              Click to plan session
            </div>
          )}
        </div>
      )}
    </div>
  );
}
