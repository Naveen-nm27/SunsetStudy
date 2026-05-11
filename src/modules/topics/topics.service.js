import { Topic } from "./topics.model.js";

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

