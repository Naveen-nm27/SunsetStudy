import moment from 'moment';
import { REVIEW_INTERVAL_DAYS, MASTERY_COMPLETIONS, isTopicMastered } from '../constants/spacedRepetition.js';
import { topicIdFromSession } from './topic.js';
import { sessionChartMs, startOfDayMs } from './sessionTimeline.js';
export const MAX_PROJECTED_REVIEWS = REVIEW_INTERVAL_DAYS.length;
export { startOfDayMs };
export function computeReviewSchedule({ topic, sessions, maxReviews = MAX_PROJECTED_REVIEWS }) {
  if (!topic?._id) return { completions: [], reviews: [] };
  const topicSessions = sessions.filter(s => topicIdFromSession(s) === topic._id);
  const completions = topicSessions.filter(s => s.status === 'completed')
    .map(s => ({ ...s, t: sessionChartMs(s) })).sort((a, b) => a.t - b.t);
  if ((!completions.length && !topic.nextReviewDate) || (isTopicMastered(topic) && !topic.continueStudying)) return { completions, reviews: [] };
  const plannedByDay = new Map(topicSessions.filter(s => s.status === 'planned').map(s => [startOfDayMs(s.date), s]));
  const stage = topic.reviewStage ?? completions.length;
  const remaining = topic.continueStudying ? 1 : Math.max(0, MASTERY_COMPLETIONS - stage);
  const todayMs = moment().startOf('day').valueOf();
  const lastT = completions.at(-1)?.t ?? topic.masteredAt;
  // Keep the server's due date even when it is overdue.
  let dateMs = topic.nextReviewDate ? startOfDayMs(topic.nextReviewDate)
    : startOfDayMs(moment.utc(lastT).add(REVIEW_INTERVAL_DAYS[Math.min(Math.max(stage - 1, 0), 5)], 'days').valueOf());
  const reviews = [];
  for (let i = 0; i < Math.min(maxReviews, remaining); i++) {
    const planned = plannedByDay.get(dateMs);
    reviews.push({
      dateMs, intervalDays: REVIEW_INTERVAL_DAYS[Math.min(Math.max(stage + i - 1, 0), 5)],
      reviewNumber: Math.max(stage, 1) + i, hasPlannedSession: Boolean(planned), plannedSessionId: planned?._id,
      isPast: dateMs < todayMs, isToday: dateMs === todayMs, isNext: i === 0,
      isFinal: !topic.continueStudying && i === remaining - 1,
    });
    dateMs = moment(dateMs).add(REVIEW_INTERVAL_DAYS[Math.min(stage + i, 5)], 'days').startOf('day').valueOf();
  }
  return { completions, reviews };
}
