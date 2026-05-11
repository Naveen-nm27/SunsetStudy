import { Topic } from "./topics.model.js";

/** Days until next review after each completed session (stage indexes into this array). */
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30];

function addCalendarDays(from, days) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

/** Called when a session is newly marked completed; advances spaced-repetition fields on the topic. */
export const advanceTopicReviewSchedule = async (topicObjectId) => {
  const topic = await Topic.findById(topicObjectId);
  if (!topic) return null;

  const stage = topic.reviewStage ?? 0;
  const idx = Math.min(stage, REVIEW_INTERVAL_DAYS.length - 1);
  const days = REVIEW_INTERVAL_DAYS[idx];

  topic.lastStudiedAt = new Date();
  topic.nextReviewDate = addCalendarDays(new Date(), days);
  topic.reviewStage = stage + 1;

  await topic.save();
  return topic;
};

export const getTopicsDueTodayService = async (userObjectId) => {
  return await Topic.find({
    userObjectId,
    nextReviewDate: { $lte: new Date() },
  })
    .sort({ nextReviewDate: 1 })
    .populate("userObjectId")
    .populate("subjectObjectId");
};

export const createTopicService = async (data) => {
  const topic = new Topic(data);
  return await topic.save();
};

export const getTopicsService = async (filter = {}) => {
  return await Topic.find(filter)
    .sort({ createdAt: -1 })
    .populate("userObjectId")
    .populate("subjectObjectId");
};

export const getTopicByIdService = async (id) => {
  return await Topic.findById(id).populate("userObjectId").populate("subjectObjectId");
};

export const updateTopicByIdService = async (id, data) => {
  return await Topic.findByIdAndUpdate(id, data, { new: true })
    .populate("userObjectId")
    .populate("subjectObjectId");
};

export const deleteTopicByIdService = async (id) => {
  return await Topic.findByIdAndDelete(id);
};

