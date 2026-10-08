import { useMemo, useState } from 'react';
import moment from 'moment';
import { computeReviewSchedule } from '../utils/reviewSchedule';
import { sessionChartMs } from '../utils/sessionTimeline';
import { isTopicMastered, REVIEW_INTERVAL_DAYS } from '../constants/spacedRepetition';

const W = 720, H = 300, PAD = { left: 48, right: 20, top: 24, bottom: 42 };
export default function ForgettingCurveChart({ topic, sessions, selectedSessionId, onScheduleReview }) {
  const [now] = useState(() => Date.now());
  const model = useMemo(() => {
    const { completions, reviews } = computeReviewSchedule({ topic, sessions });
    if (!completions.length) return null;
    const recent = completions.slice(-30);
    const min = recent[0].t - 86400000;
    const max = Math.max(now, recent.at(-1).t, ...reviews.map(r => r.dateMs)) + 3 * 86400000;
    const x = time => PAD.left + (time - min) / Math.max(1, max - min) * (W - PAD.left - PAD.right);
    const y = retention => PAD.top + (100 - retention) / 100 * (H - PAD.top - PAD.bottom);
    const paths = recent.map((session, index) => {
      const end = recent[index + 1]?.t ?? max;
      // An illustrative curve; stronger memory after repeated practice is not a measured score.
      const practice = completions.length - recent.length + index;
      const tau = Math.max(5, REVIEW_INTERVAL_DAYS[Math.min(practice, 5)]);
      const points = Array.from({ length: 65 }, (_, i) => {
        const time = session.t + (end - session.t) * i / 64;
        const retention = 100 * Math.exp(-(time - session.t) / (86400000 * tau));
        return (i ? 'L' : 'M') + x(time).toFixed(2) + ',' + y(retention).toFixed(2);
      });
      return points.join(' ');
    });
    const selected = sessions.find(s => s._id === selectedSessionId);
    return { recent, reviews, paths, min, max, x, y, selected: selected ? sessionChartMs(selected) : null };
  }, [topic, sessions, selectedSessionId, now]);
  if (!topic) return null;
  if (!model) return <div className="fun-card p-8 text-center"><p className="font-serif text-lg">No completed sessions yet</p><p className="text-text-muted mt-2">Complete your initial study to see the curve and six review dates.</p></div>;
  const mastered = isTopicMastered(topic);
  return <section className="fun-card p-4 md:p-6 space-y-4">
    <div><h3 className="font-serif text-xl font-bold text-sunset-orange">Forgetting curve</h3><p className="text-sm text-text-muted mt-1">Illustrative memory decay after practice. This curve is not a measurement of your retention.</p></div>
    {mastered && !topic.continueStudying && <p className="text-sunset-orange">Review milestone reached. Future dates are paused until you choose to keep studying.</p>}
    <svg viewBox={'0 0 ' + W + ' ' + H} width="100%" role="img" aria-label="Illustrative forgetting curve and review dates">
      {[0, 25, 50, 75, 100].map(value => <g key={value}><line x1={PAD.left} x2={W - PAD.right} y1={model.y(value)} y2={model.y(value)} stroke="currentColor" opacity=".1" /><text x={PAD.left - 8} y={model.y(value) + 4} textAnchor="end" fontSize="11" fill="currentColor">{value}%</text></g>)}
      {model.paths.map((path, i) => <path key={i} d={path} stroke="var(--sun-ember, #F97316)" strokeWidth="2.5" fill="none" />)}
      {model.recent.map(session => <circle key={session._id} cx={model.x(session.t)} cy={model.y(100)} r={session._id === selectedSessionId ? 7 : 4} fill="#EC4899"><title>Completed {moment(session.t).format('MMM D, YYYY h:mm A')}</title></circle>)}
      {model.reviews.map(review => <g key={review.dateMs} role={review.hasPlannedSession ? undefined : 'button'} tabIndex={review.hasPlannedSession ? undefined : 0}
        aria-label={(review.isFinal ? 'Final review: ' : 'Review: ') + moment(review.dateMs).format('MMM D, YYYY') + (review.hasPlannedSession ? ', already planned' : ', plan session')}
        onClick={() => !review.hasPlannedSession && onScheduleReview?.({ dateMs: review.dateMs })}
        onKeyDown={event => { if (!review.hasPlannedSession && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onScheduleReview?.({ dateMs: review.dateMs }); } }}>
        <line x1={model.x(review.dateMs)} x2={model.x(review.dateMs)} y1={PAD.top} y2={H - PAD.bottom} stroke="#FBBF24" opacity=".3" strokeDasharray="4 4" />
        <circle cx={model.x(review.dateMs)} cy={PAD.top + 15} r="6" fill={review.hasPlannedSession ? '#FBBF24' : 'transparent'} stroke="#FBBF24" strokeWidth="2"><title>{review.isFinal ? 'Final scheduled review' : 'Review ' + review.reviewNumber} · {moment(review.dateMs).format('MMM D, YYYY')}</title></circle>
      </g>)}
      {model.selected !== null && <line x1={model.x(model.selected)} x2={model.x(model.selected)} y1={PAD.top} y2={H - PAD.bottom} stroke="#F97316" strokeDasharray="3 3" />}
      {Array.from({ length: 5 }, (_, i) => { const time = model.min + (model.max - model.min) * i / 4; return <text key={i} x={model.x(time)} y={H - 12} textAnchor="middle" fontSize="11" fill="currentColor">{moment(time).format('MMM D')}</text>; })}
    </svg>
    <p className="text-xs text-text-muted">Pink: completed study · Yellow: scheduled or suggested review. Select an unfilled yellow dot to plan a session. Future dates assume each review is completed on time.{model.recent.length === 30 ? ' Showing the most recent 30 completions.' : ''}</p>
  </section>;
}
