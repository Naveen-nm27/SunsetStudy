import {
  createSubjectService,
  deleteSubjectByIdService,
  getSubjectByIdService,
  getSubjectsService,
  updateSubjectByIdService,
} from "./subjects.service.js";
import { Subject } from "./subjects.model.js";
import { getAuthUserId, stripUserObjectId } from "../../utils/authUser.js";
import { findOwnedById, notFound } from "../../utils/ownership.js";

const userFilter = (req, query = {}) => {
  const userId = getAuthUserId(req);
  const { status, type } = query;
  const filter = { userObjectId: userId };
  if (status) filter.status = status;
  if (type) filter.type = type;
  return filter;
};

export const createSubject = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const subject = await createSubjectService({ ...req.body, userObjectId: userId });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSubjects = async (req, res) => {
  try {
    const subjects = await getSubjectsService(userFilter(req, req.query));
    res.status(200).json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const owned = await findOwnedById(Subject, req.params.id, userId);
    if (!owned) return res.status(404).json(notFound().body);

    const subject = await getSubjectByIdService(req.params.id);
    res.status(200).json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const owned = await findOwnedById(Subject, req.params.id, userId);
    if (!owned) return res.status(404).json(notFound().body);

    const subject = await updateSubjectByIdService(req.params.id, stripUserObjectId(req.body));
    if (!subject) return res.status(404).json(notFound().body);
    res.status(200).json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const owned = await findOwnedById(Subject, req.params.id, userId);
    if (!owned) return res.status(404).json(notFound().body);

    const result = await deleteSubjectByIdService(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
