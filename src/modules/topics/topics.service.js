import { Topic } from "./topics.model.js";
import { Session } from "../sessions/sessions.model.js";
import { reviewState, reviewHistory } from "../../../shared/reviewPolicy.js";
import { withTopicLock } from "../../utils/topicLock.js";

/** Days until next review after each completed session (stage indexes into this array). */
export { REVIEW_INTERVAL_DAYS } from "../../../shared/reviewPolicy.js";

/** Called when a session is newly marked completed; advances spaced-repetition fields on the topic. */
export const advanceTopicReviewSchedule = async (topicObjectId) => {
  const topic = await Topic.findById(topicObjectId);
  if (!topic) return null;

  const completions = await Session.find({ topicObjectId, status: 'completed' })
    .select('completedAt updatedAt date').lean();
  const state = reviewHistory(completions.map(session => session.completedAt ?? session.updatedAt ?? session.date), topic.continueStudying);
  const manual = topic.masterySource === 'manual' || (topic.status === 'done' && !topic.masterySource);
  if (manual) {
    topic.masteredAt ??= state.lastStudiedAt ?? new Date();
    topic.masterySource = 'manual';
    topic.reviewStage = 6;
    topic.lastStudiedAt = state.lastStudiedAt;
    topic.nextReviewDate = topic.continueStudying ? reviewState(7, state.lastStudiedAt ?? topic.masteredAt, true).nextReviewDate : null;
    await topic.save();
    return topic;
  }
  topic.reviewStage = state.reviewStage;
  topic.lastStudiedAt = state.lastStudiedAt;
  topic.nextReviewDate = state.nextReviewDate;
  topic.masteredAt = state.masteredAt;
  topic.masterySource = state.mastered ? 'reviews' : null;
  topic.status = state.mastered ? "done" : state.credited ? "in progress" : "not started";
  await topic.save();
  return topic;
};

export const getTopicsDueTodayService = async (userObjectId) => {
  return await Topic.find({
    userObjectId,
    nextReviewDate: { $ne: null, $lte: new Date(new Date().setUTCHours(23, 59, 59, 999)) },
    $or: [{ status: { $ne: "done" } }, { continueStudying: true }],
  })
    .sort({ nextReviewDate: 1 })
    .populate("subjectObjectId", "name color type").lean();
};

export const createTopicService = async (data) => {
  const topic = new Topic(data);
  return await topic.save();
};

export const getTopicsService = async (filter = {}) => {
  return await Topic.find(filter)
    .sort({ createdAt: -1 })
    .populate("subjectObjectId", "name color type").lean();
};

export const getTopicByIdService = async (id) => {
  return await Topic.findById(id).populate("subjectObjectId", "name color type").lean();
};

export const updateTopicByIdService = async (id, data) => {
  return withTopicLock(id, async () => {
    const topic = await Topic.findById(id);
    if (topic) {
      const wasMastered = Boolean(topic.masteredAt || topic.status === 'done');
      const wasContinuing = topic.continueStudying;
      if ((data.continueStudying && !wasMastered && data.status !== 'done') || (wasMastered && data.status && data.status !== 'done')) {
        const error = new Error('Use the Keep studying or Finish for now choices in Memory for mastered topics.');
        error.status = 400; throw error;
      }
      Object.assign(topic, data);
      if (data.status === 'done' && !wasMastered) { topic.masteredAt = new Date(); topic.masterySource = 'manual'; topic.nextReviewDate = null; }
      if (Object.hasOwn(data, 'continueStudying') && data.continueStudying !== wasContinuing && (topic.masteredAt || topic.status === 'done')) {
        topic.nextReviewDate = data.continueStudying ? reviewState(7, new Date(), true).nextReviewDate : null;
      }
      await topic.save();
    }
    return Topic.findById(id).populate("subjectObjectId", "name color type").lean();
  });
};

export const deleteTopicByIdService = async (id) => {
  return withTopicLock(id, async () => {
    if (await Session.exists({ topicObjectId: id })) {
      const error = new Error('Remove this topic\'s sessions first, or mark it done to preserve your history.');
      error.status = 409; throw error;
    }
    return Topic.findByIdAndDelete(id);
  });
};

