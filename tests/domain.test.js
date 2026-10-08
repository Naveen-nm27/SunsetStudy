import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewHistory, reviewState } from '../shared/reviewPolicy.js';
import { computeReviewSchedule } from '../frontend/src/utils/reviewSchedule.js';
import { buildCalendarEvents } from '../frontend/src/utils/calendarEvents.js';
import { normalizeTimerSettings, nextTimerPhase } from '../frontend/src/utils/pomodoro.js';
import { importSubjectsSchema } from '../src/modules/subjects/subjects.import.js';
import { withTopicLock } from '../src/utils/topicLock.js';

const base = new Date('2026-01-01T12:00:00Z');
const day = offset => new Date(base.getTime() + offset * 86400000);
const history = [0, 1, 4, 11, 25, 55, 115].map(day);

test('Initial study and six due reviews end at mastery, including the last 60-day gap', () => {
  const state = reviewHistory(history.slice(0, 6));
  assert.equal(state.reviewStage, 6); assert.equal(state.mastered, false);
  assert.equal(state.nextReviewDate.toISOString(), day(115).toISOString());
  const mastered = reviewHistory(history);
  assert.equal(mastered.mastered, true); assert.equal(mastered.nextReviewDate, null);
  assert.equal(mastered.masteredAt.toISOString(), day(115).toISOString());
});
test('Early practice and duplicate timestamps cannot skip review stages', () => {
  const state = reviewHistory([day(0), day(0), day(0), day(0), day(0), day(0), day(0)]);
  assert.equal(state.reviewStage, 1); assert.equal(state.mastered, false);
  assert.equal(state.nextReviewDate.toISOString(), day(1).toISOString());
  assert.equal(reviewHistory([day(0), day(1), day(2), day(3)]).reviewStage, 2);
});
test('Review credit is based on the due calendar day, rather than the original time of day', () => {
  assert.equal(reviewHistory([base, new Date('2026-01-02T08:00:00Z')]).reviewStage, 2);
});
test('Removing an incorrect final completion restores its due review', () => {
  const restored = reviewHistory(history.slice(0, -1));
  assert.equal(restored.masteredAt, null); assert.equal(restored.nextReviewDate.toISOString(), day(115).toISOString());
});
test('Optional continuing reviews retain mastery and schedule the next 60-day review', () => {
  const next = reviewHistory([...history, day(175)], true);
  assert.equal(next.mastered, true); assert.equal(next.nextReviewDate.toISOString(), day(235).toISOString());
  assert.equal(reviewState(0).nextReviewDate, null);
});
const sessionsFor = dates => dates.map((date, i) => ({ _id: 's' + i, topicObjectId: 'topic', status: 'completed', date, completedAt: date }));
test('Projected dates stop at the final review and preserve overdue dates', () => {
  const topic = { _id: 'topic', reviewStage: 1, nextReviewDate: day(1) };
  const result = computeReviewSchedule({ topic, sessions: sessionsFor([base]) });
  assert.equal(result.reviews.length, 6);
  const localDay = milliseconds => { const date = new Date(milliseconds); return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-'); };
  assert.deepEqual(result.reviews.map(r => localDay(r.dateMs)), history.slice(1).map(d => d.toISOString().slice(0, 10)));
  assert.equal(result.reviews.at(-1).isFinal, true);
  assert.equal(result.reviews[0].isPast, true);
});
test('Mastered topics produce no suggested dates unless the user opts in', () => {
  const topic = { _id: 'topic', status: 'done', reviewStage: 6, masteredAt: day(115) };
  assert.equal(computeReviewSchedule({ topic, sessions: sessionsFor(history) }).reviews.length, 0);
  assert.equal(computeReviewSchedule({ topic: { ...topic, continueStudying: true, nextReviewDate: day(175) }, sessions: sessionsFor(history) }).reviews.length, 1);
});
test('Extra early completions do not reduce the number of remaining suggested reviews', () => {
  assert.equal(computeReviewSchedule({ topic: { _id: 'topic', reviewStage: 1, nextReviewDate: day(1) }, sessions: sessionsFor([base, base, base]) }).reviews.length, 6);
});
test('Recurring commitments start on their configured date and overnight events end the next day', () => {
  const events = buildCalendarEvents([], [{ _id: 'b', title: 'Sleep', date: '2026-01-06', startTime: '22:00', endTime: '06:00', recurring: true, days: ['monday', 'wednesday'] }], new Date('2026-01-05'), new Date('2026-01-11'));
  assert.equal(events.length, 1);
  assert.equal(events[0].start.getDate(), 7); assert.equal(events[0].end.getDate(), 8);
  assert.equal(events[0].end.getTime() - events[0].start.getTime(), 8 * 3600000);
});
test('Pomodoro alternates focus and breaks, reserving long breaks for the configured round count', () => {
  const settings = normalizeTimerSettings({ focus: 40, shortBreak: 8, longBreak: 20, rounds: 2, autoStart: true });
  let timer = { phase: 'focus', cycles: 0, deadline: 100000, session: { _id: 's' } };
  timer = nextTimerPhase(timer, settings);
  assert.equal(timer.phase, 'shortBreak'); assert.equal(timer.cycles, 1); assert.equal(timer.deadline, 580000);
  timer = nextTimerPhase(timer, settings);
  assert.equal(timer.phase, 'focus'); assert.equal(timer.cycles, 1);
  timer = nextTimerPhase(timer, settings);
  assert.equal(timer.phase, 'longBreak'); assert.equal(timer.cycles, 2);
  assert.equal(timer.session._id, 's');
});
test('Day view includes a recurring commitment that started the previous night', () => {
  const events = buildCalendarEvents([], [{ _id: 'b', title: 'Sleep', date: '2026-01-01', startTime: '22:00', endTime: '06:00', recurring: true, days: ['wednesday'] }], new Date('2026-01-08T10:00:00'), new Date('2026-01-08T23:59:59'));
  assert.equal(events.length, 1); assert.equal(events[0].start.getDate(), 7); assert.equal(events[0].end.getDate(), 8);
});
test('Manual phase transitions wait for the user and invalid timer settings are bounded', () => {
  const settings = normalizeTimerSettings({ focus: -2, rounds: 999, longBreak: 'bad' });
  assert.equal(settings.focus, 25); assert.equal(settings.rounds, 12); assert.equal(settings.longBreak, 15);
  const next = nextTimerPhase({ phase: 'focus', cycles: 0, deadline: 0 }, settings);
  assert.equal(next.running, false); assert.equal(next.deadline, null); assert.equal(next.remaining, 300);
});
test('JSON imports validate all nested content and reject duplicate or forged ownership fields', () => {
  assert.equal(importSubjectsSchema.safeParse({ subjects: [{ name: 'Math', topics: ['Algebra', { name: 'Calculus' }] }] }).success, true);
  for (const body of [
    { subjects: [{ name: 'Math', topics: ['Algebra', 'algebra'] }] },
    { subjects: [{ name: 'Math' }, { name: 'math' }] },
    { subjects: [{ name: 'Math', userObjectId: 'attacker' }] },
    { subjects: [{ name: 'Math', topics: [{ name: '' }] }] },
    { subjects: [{ name: 'Math', color: 'red' }] },
  ]) assert.equal(importSubjectsSchema.safeParse(body).success, false);
});
test('Topic changes serialize concurrent work and recover after a failed mutation', async () => {
  const order = [];
  await Promise.all([
    withTopicLock('t', async () => { await new Promise(resolve => setTimeout(resolve, 10)); order.push(1); }),
    withTopicLock('t', async () => { order.push(2); }),
  ]);
  assert.deepEqual(order, [1, 2]);
  await assert.rejects(withTopicLock('t', () => { throw new Error('expected'); }));
  assert.equal(await withTopicLock('t', () => 3), 3);
});
