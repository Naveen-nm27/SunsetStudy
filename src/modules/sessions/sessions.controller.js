import {
  createSessionService,
  deleteSessionByIdService,
  getSessionByIdService,
  getSessionsService,
  updateSessionByIdService,
} from "./sessions.service.js";
import { Session } from "./sessions.model.js";
import { Subject } from "../subjects/subjects.model.js";
import { Topic } from "../topics/topics.model.js";
import { getAuthUserId, stripUserObjectId } from "../../utils/authUser.js";
import { findOwnedById, notFound } from "../../utils/ownership.js";

const userFilter = (req, query = {}) => {
  const userId = getAuthUserId(req);
  const { subjectObjectId, topicObjectId, status } = query;
  const filter = { userObjectId: userId };
  if (subjectObjectId) filter.subjectObjectId = subjectObjectId;
  if (topicObjectId) filter.topicObjectId = topicObjectId;
  if (status) filter.status = status;
  return filter;
};

const assertSessionRelations = async (body, userId) => {
  const subject = await findOwnedById(Subject, body.subjectObjectId, userId);
  if (!subject) return { status: 400, body: { message: "Invalid subject" } };
  const topic = await findOwnedById(Topic, body.topicObjectId, userId);
  if (!topic) return { status: 400, body: { message: "Invalid topic" } };
  return null;
};

export const createSession = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const relationErr = await assertSessionRelations(req.body, userId);
    if (relationErr) return res.status(relationErr.status).json(relationErr.body);

    const session = await createSessionService({ ...req.body, userObjectId: userId });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSessions = async (req, res) => {
  try {
    const sessions = await getSessionsService(userFilter(req, req.query));
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const owned = await findOwnedById(Session, req.params.id, userId);
    if (!owned) return res.status(404).json(notFound().body);

    const session = await getSessionByIdService(req.params.id);
    res.status(200).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSession = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const owned = await findOwnedById(Session, req.params.id, userId);
    if (!owned) return res.status(404).json(notFound().body);

    const data = stripUserObjectId(req.body);
    if (data.subjectObjectId || data.topicObjectId) {
      const relationErr = await assertSessionRelations(
        {
          subjectObjectId: data.subjectObjectId ?? owned.subjectObjectId,
          topicObjectId: data.topicObjectId ?? owned.topicObjectId,
        },
        userId
      );
      if (relationErr) return res.status(relationErr.status).json(relationErr.body);
    }

    const session = await updateSessionByIdService(req.params.id, data);
    if (!session) return res.status(404).json(notFound().body);
    res.status(200).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const owned = await findOwnedById(Session, req.params.id, userId);
    if (!owned) return res.status(404).json(notFound().body);

    const result = await deleteSessionByIdService(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
