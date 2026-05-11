import {
  createSessionService,
  deleteSessionByIdService,
  getSessionByIdService,
  getSessionsService,
  updateSessionByIdService,
} from "./sessions.service.js";

export const createSession = async (req, res) => {
  try {
    const session = await createSessionService(req.body);
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSessions = async (req, res) => {
  try {
    const { userObjectId, subjectObjectId, topicObjectId, status } = req.query;
    const filter = {};
    if (userObjectId) filter.userObjectId = userObjectId;
    if (subjectObjectId) filter.subjectObjectId = subjectObjectId;
    if (topicObjectId) filter.topicObjectId = topicObjectId;
    if (status) filter.status = status;

    const sessions = await getSessionsService(filter);
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const session = await getSessionByIdService(req.params.id);
    res.status(200).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSession = async (req, res) => {
  try {
    const session = await updateSessionByIdService(req.params.id, req.body);
    res.status(200).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const result = await deleteSessionByIdService(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

