export const REVIEW_INTERVAL_DAYS = Object.freeze([1, 3, 7, 14, 30, 60]);
export const MAX_REVIEW_STAGE = REVIEW_INTERVAL_DAYS.length;
export const MASTERY_COMPLETIONS = MAX_REVIEW_STAGE + 1;
export function isTopicMastered(topic) {
  return Boolean(topic && (topic.masteredAt || topic.status === 'done'));
}
export function reviewState(completedCount, lastCompletedAt, continueStudying = false) {
  const reviewStage = Math.min(completedCount, MAX_REVIEW_STAGE);
  const mastered = completedCount >= MASTERY_COMPLETIONS;
  if (!completedCount || (mastered && !continueStudying)) return { reviewStage, nextReviewDate: null, mastered };
  const interval = REVIEW_INTERVAL_DAYS[Math.min(completedCount - 1, MAX_REVIEW_STAGE - 1)];
  const nextReviewDate = new Date(lastCompletedAt);
  nextReviewDate.setUTCDate(nextReviewDate.getUTCDate() + interval);
  return { reviewStage, nextReviewDate, mastered };
}

export function reviewHistory(completions, continueStudying = false) {
  const dates = completions.map(value => new Date(value)).filter(date => Number.isFinite(date.getTime())).sort((a, b) => a - b);
  let credited = 0, state = reviewState(0), masteredAt = null;
  for (const date of dates) {
    // Extra practice before the due day cannot skip the spaced intervals.
    if (state.nextReviewDate && date.toISOString().slice(0, 10) < state.nextReviewDate.toISOString().slice(0, 10)) continue;
    if (state.mastered && !continueStudying) break;
    credited++;
    state = reviewState(credited, date, continueStudying);
    if (state.mastered && !masteredAt) masteredAt = date;
  }
  return { ...state, credited, masteredAt, lastStudiedAt: dates.at(-1) ?? null };
}
