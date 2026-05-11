import {
  createTopicService,
  deleteTopicByIdService,
  getTopicByIdService,
  getTopicsDueTodayService,
  getTopicsService,
  updateTopicByIdService,
} from "./topics.service.js";

export const createTopic = async (req, res) => {
  try {
    const topic = await createTopicService(req.body);
    res.status(201).json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTopicsDueToday = async (req, res) => {
  try {
    const { userObjectId } = req.query;
    if (!userObjectId) {
      return res.status(400).json({ message: "userObjectId query parameter is required" });
    }

    const topics = await getTopicsDueTodayService(userObjectId);
    res.status(200).json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTopics = async (req, res) => {
  try {
    const { userObjectId, subjectObjectId, status } = req.query;
    const filter = {};
    if (userObjectId) filter.userObjectId = userObjectId;
    if (subjectObjectId) filter.subjectObjectId = subjectObjectId;
    if (status) filter.status = status;

    const topics = await getTopicsService(filter);
    res.status(200).json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTopicById = async (req, res) => {
  try {
    const topic = await getTopicByIdService(req.params.id);
    res.status(200).json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateTopic = async (req, res) => {
  try {
    const topic = await updateTopicByIdService(req.params.id, req.body);
    res.status(200).json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteTopic = async (req, res) => {
  try {
    const result = await deleteTopicByIdService(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

