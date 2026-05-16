import { useMemo } from 'react';
import moment from 'moment';
import { CalendarCheck, Plus } from 'lucide-react';
import { computeReviewSchedule } from '../utils/reviewSchedule';

export default function ReviewScheduleList({ topic, sessions, onScheduleReview }) {
  const { completions, reviews } = useMemo(
    () => computeReviewSchedule({ topic, sessions }),
    [topic, sessions]
  );

  if (!topic) return null;

  if (completions.length === 0) {
    return (
      <div className="fun-card p-4 md:p-6">
        <p className="font-serif text-base text-text-main mb-1">Review schedule</p>
        <p className="font-mono text-xs uppercase text-text-muted leading-relaxed">
          Complete a study session for this topic to see your spaced-repetition review dates.
        </p>
      </div>
    );
  }

  return (
    <div className="fun-card p-4 md:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-sunset-orange/15 text-sunset-orange border border-border-color flex-shrink-0">
          <CalendarCheck size={20} />
        </div>
        <div>
          <h3 className="font-serif text-lg font-semibold text-text-main">Review schedule</h3>
          <p className="font-mono text-xs uppercase text-text-muted mt-1 leading-relaxed">
            Dates to revisit this topic and beat the forgetting curve. Plan a session from any row.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-border-color rounded-xl border border-border-color overflow-hidden">
        {reviews.map((r) => {
          const dateLabel = moment(r.dateMs).format('dddd, MMM D, YYYY');
          const relative = moment(r.dateMs).fromNow();
          const statusLabel = r.isToday
            ? 'Due today'
            : r.isPast
              ? 'Overdue'
              : r.isNext
                ? 'Next up'
                : `Review ${r.reviewNumber}`;

          return (
            <li
              key={r.dateMs}
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-bg-elevated/40 ${
                r.isNext ? 'bg-sunset-orange/5' : ''
              }`}
            >
              <div>
                <p className="font-serif text-base text-text-main">{dateLabel}</p>
                <p className="font-mono text-xs text-text-muted mt-0.5">
                  {relative}
                  {r.hasPlannedSession && ' · Session already on your list'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`font-mono text-[10px] uppercase font-bold px-2 py-1 rounded-lg border ${
                    r.isPast
                      ? 'border-sunset-pink text-sunset-pink bg-sunset-pink/10'
                      : r.isToday
                        ? 'border-sunset-orange text-sunset-orange bg-sunset-orange/10'
                        : r.isNext
                          ? 'border-sunset-yellow text-sunset-deep dark:text-sunset-yellow bg-sunset-yellow/20'
                          : 'border-border-color text-text-muted'
                  }`}
                >
                  {statusLabel}
                </span>
                {onScheduleReview && !r.hasPlannedSession && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border-color text-xs font-mono uppercase font-bold hover:border-sunset-orange text-sunset-orange"
                    onClick={() => onScheduleReview({ dateMs: r.dateMs })}
                  >
                    <Plus size={12} /> Plan
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
