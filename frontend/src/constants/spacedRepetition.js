/** Mirrors backend `src/modules/topics/topics.service.js` — days until next review after each completed session. */
export { REVIEW_INTERVAL_DAYS, MAX_REVIEW_STAGE, MASTERY_COMPLETIONS, isTopicMastered } from '../../../shared/reviewPolicy.js';

export function isNewlyAdded(createdAt, hours = 24) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < hours * 60 * 60 * 1000;
}
