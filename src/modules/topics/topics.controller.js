import {
  createTopicService,
  deleteTopicByIdService,
  getTopicByIdService,
  getTopicsDueTodayService,
  getTopicsService,
  updateTopicByIdService,
} from "./topics.service.js";
import { Topic } from "./topics.model.js";
import { Subject } from "../subjects/subjects.model.js";
import { getAuthUserId, stripUserObjectId } from "../../utils/authUser.js";
import { findOwnedById, notFound } from "../../utils/ownership.js";

const userFilter = (req, query = {}) => {
  const userId = getAuthUserId(req);
  const { subjectObjectId, status } = query;
  const filter = { userObjectId: userId };
  if (subjectObjectId) filter.subjectObjectId = subjectObjectId;
  if (status) filter.status = status;
  return filter;
};

export const createTopic = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const subject = await findOwnedById(Subject, req.body.subjectObjectId, userId);
    if (!subject) {
      return res.status(400).json({ message: "Invalid subject" });
    }

    const topic = await createTopicService({ ...req.body, userObjectId: userId });
    res.status(201).json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTopicsDueToday = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const topics = await getTopicsDueTodayService(userId);
    res.status(200).json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTopics = async (req, res) => {
  try {
    const topics = await getTopicsService(userFilter(req, req.query));
    res.status(200).json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTopicById = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const owned = await findOwnedById(Topic, req.params.id, userId);
    if (!owned) return res.status(404).json(notFound().body);

    const topic = await getTopicByIdService(req.params.id);
    res.status(200).json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateTopic = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const owned = await findOwnedById(Topic, req.params.id, userId);
    if (!owned) return res.status(404).json(notFound().body);

    const topic = await updateTopicByIdService(req.params.id, stripUserObjectId(req.body));
    if (!topic) return res.status(404).json(notFound().body);
    res.status(200).json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteTopic = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const owned = await findOwnedById(Topic, req.params.id, userId);
    if (!owned) return res.status(404).json(notFound().body);

    const result = await deleteTopicByIdService(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
