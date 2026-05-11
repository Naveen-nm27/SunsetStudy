import { advanceTopicReviewSchedule } from "../topics/topics.service.js";
import { Session } from "./sessions.model.js";

export const createSessionService = async (data) => {
  const session = new Session(data);
  await session.save();

  if (session.status === "completed" && session.topicObjectId) {
    await advanceTopicReviewSchedule(session.topicObjectId);
  }

  return session;
};

export const getSessionsService = async (filter = {}) => {
  return await Session.find(filter)
    .sort({ date: -1, startTime: -1 })
    .populate("userObjectId")
    .populate("subjectObjectId")
    .populate("topicObjectId");
};

export const getSessionByIdService = async (id) => {
  return await Session.findById(id)
    .populate("userObjectId")
    .populate("subjectObjectId")
    .populate("topicObjectId");
};

export const updateSessionByIdService = async (id, data) => {
  const session = await Session.findById(id);
  if (!session) return null;

  const wasCompleted = session.status === "completed";
  const nextStatus = data.status !== undefined ? data.status : session.status;
  const becomingCompleted = !wasCompleted && nextStatus === "completed";

  Object.assign(session, data);
  await session.save();

  if (becomingCompleted && session.topicObjectId) {
    await advanceTopicReviewSchedule(session.topicObjectId);
  }

  return await Session.findById(session._id)
    .populate("userObjectId")
    .populate("subjectObjectId")
    .populate("topicObjectId");
};

export const deleteSessionByIdService = async (id) => {
  return await Session.findByIdAndDelete(id);
};

