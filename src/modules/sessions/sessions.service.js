import { advanceTopicReviewSchedule } from '../topics/topics.service.js';
import { Topic } from '../topics/topics.model.js';
import { Session } from './sessions.model.js';
import { withTopicLock } from '../../utils/topicLock.js';

export class DuplicatePlannedSessionError extends Error {
  constructor(message = 'A planned session for this topic already exists on this date') {
    super(message); this.status = 400;
  }
}
function badRequest(message) { const error = new Error(message); error.status = 400; return error; }

async function assertCanPlan(data, excludeId) {
  const topic = await Topic.findById(data.topicObjectId).lean();
  if (!topic) throw badRequest('This topic no longer exists.');
  if ((topic.masteredAt || topic.status === 'done') && !topic.continueStudying) {
    throw badRequest('This topic is mastered. Choose to keep studying in Memory before planning another session.');
  }
  if (data.status !== 'planned') return;
  const start = new Date(data.date); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
  const query = { topicObjectId: data.topicObjectId, status: 'planned', date: { $gte: start, $lt: end } };
  if (excludeId) query._id = { $ne: excludeId };
  if (await Session.exists(query)) throw new DuplicatePlannedSessionError();
}
const populate = (query) => query
  .populate('subjectObjectId', 'name color type')
  .populate('topicObjectId', 'name color subjectObjectId reviewStage status masteredAt continueStudying nextReviewDate')
  .lean();

export const createSessionService = (data) => withTopicLock(data.topicObjectId, async () => {
  const clean = { ...data, status: data.status ?? 'planned' };
  await assertCanPlan(clean);
  if (clean.startTime === clean.endTime) throw badRequest('Start and end times must differ.');
  clean.completedAt = clean.status === 'completed' ? new Date() : null;
  const session = await Session.create(clean);
  if (session.status === 'completed') await advanceTopicReviewSchedule(session.topicObjectId);
  return getSessionByIdService(session._id);
});
export const getSessionsService = (filter = {}) => populate(Session.find(filter).sort({ date: -1, startTime: -1 }));
export const getSessionByIdService = (id) => populate(Session.findById(id));

export const updateSessionByIdService = async (id, data) => {
  const original = await Session.findById(id).lean();
  if (!original) return null;
  return withTopicLock(original.topicObjectId, async () => {
    const session = await Session.findById(id);
    if (!session) return null;
    if (data.topicObjectId && String(data.topicObjectId) !== String(session.topicObjectId)) throw badRequest('Create a new session to change its topic.');
    if (session.status === 'completed' && data.status === 'planned') throw badRequest('Completed sessions cannot be reopened. Delete an incorrect completion instead.');
    const becomingCompleted = session.status !== 'completed' && data.status === 'completed';
    const next = { ...session.toObject(), ...data };
    if (next.startTime === next.endTime) throw badRequest('Start and end times must differ.');
    if (session.status !== 'completed') await assertCanPlan(next, id);
    Object.assign(session, data);
    if (becomingCompleted) session.completedAt = new Date();
    await session.save();
    if (becomingCompleted) await advanceTopicReviewSchedule(session.topicObjectId);
    return getSessionByIdService(id);
  });
};
export const deleteSessionByIdService = async (id) => {
  const session = await Session.findById(id).lean();
  if (!session) return null;
  return withTopicLock(session.topicObjectId, async () => {
    const removed = await Session.findByIdAndDelete(id);
    if (removed?.status === 'completed') await advanceTopicReviewSchedule(session.topicObjectId);
    return removed;
  });
};
