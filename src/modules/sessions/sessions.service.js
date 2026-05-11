import { Session } from "./sessions.model.js";

export const createSessionService = async (data) => {
  const session = new Session(data);
  return await session.save();
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
  return await Session.findByIdAndUpdate(id, data, { new: true })
    .populate("userObjectId")
    .populate("subjectObjectId")
    .populate("topicObjectId");
};

export const deleteSessionByIdService = async (id) => {
  return await Session.findByIdAndDelete(id);
};

