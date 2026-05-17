import moment from 'moment';
import { REVIEW_INTERVAL_DAYS } from '../constants/spacedRepetition';
import { topicIdFromSession } from './topic';
import { sessionChartMs, startOfDayMs } from './sessionTimeline';

export const MAX_PROJECTED_REVIEWS = 10;
export { startOfDayMs };

function intervalIdx(stage) {
  return Math.min(stage, REVIEW_INTERVAL_DAYS.length - 1);
}

/**
 * Upcoming review dates for a topic (from last completion + spaced-repetition intervals).
 * Skips dates that already have a planned session on that day.
 */
export function computeReviewSchedule({ topic, sessions, maxReviews = MAX_PROJECTED_REVIEWS }) {
  const topicId = topic?._id;
  if (!topicId) return { completions: [], reviews: [] };

  const topicSessions = sessions.filter((s) => topicIdFromSession(s) === topicId);
  const completions = topicSessions
    .filter((s) => s.status === 'completed')
    .map((s) => ({ ...s, t: sessionChartMs(s) }))
    .sort((a, b) => a.t - b.t);

  if (completions.length === 0) {
    return { completions: [], reviews: [] };
  }

  const plannedByDay = new Map();
  topicSessions
    .filter((s) => s.status === 'planned')
    .forEach((p) => {
      const t = startOfDayMs(p.date);
      if (!plannedByDay.has(t)) plannedByDay.set(t, p);
    });

  const lastT = completions[completions.length - 1].t;
  const stage = topic.reviewStage ?? 0;

  let firstReviewMs;
  if (topic.nextReviewDate) {
    firstReviewMs = startOfDayMs(topic.nextReviewDate);
    if (firstReviewMs < lastT) {
      firstReviewMs = moment(lastT)
        .add(REVIEW_INTERVAL_DAYS[intervalIdx(stage)], 'days')
        .startOf('day')
        .valueOf();
    }
  } else {
    firstReviewMs = moment(lastT)
      .add(REVIEW_INTERVAL_DAYS[intervalIdx(stage)], 'days')
      .startOf('day')
      .valueOf();
  }

  const projectedMs = [];
  let sCursor = stage;
  let cursorMs = firstReviewMs;
  for (let i = 0; i < maxReviews; i++) {
    projectedMs.push({ dateMs: cursorMs, stageAtReview: sCursor });
    const idx = intervalIdx(sCursor);
    cursorMs = moment(cursorMs).add(REVIEW_INTERVAL_DAYS[idx], 'days').startOf('day').valueOf();
    sCursor += 1;
  }

  const todayMs = moment().startOf('day').valueOf();
  const reviews = projectedMs.map(({ dateMs, stageAtReview }, index) => {
    const planned = plannedByDay.get(dateMs);
    const intervalDays = REVIEW_INTERVAL_DAYS[intervalIdx(stageAtReview)];
    const isPast = dateMs < todayMs;
    const isToday = dateMs === todayMs;
    return {
      dateMs,
      intervalDays,
      reviewNumber: index + 1,
      hasPlannedSession: Boolean(planned),
      plannedSessionId: planned?._id,
      isPast,
      isToday,
      isNext: index === 0,
    };
  });

  return { completions, reviews };
}
