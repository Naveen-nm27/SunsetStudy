import {
  createSubjectService,
  deleteSubjectByIdService,
  getSubjectByIdService,
  getSubjectsService,
  updateSubjectByIdService,
} from "./subjects.service.js";

export const createSubject = async (req, res) => {
  try {
    const subject = await createSubjectService(req.body);
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSubjects = async (req, res) => {
  try {
    const { userObjectId, status, type } = req.query;
    const filter = {};
    if (userObjectId) filter.userObjectId = userObjectId;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const subjects = await getSubjectsService(filter);
    res.status(200).json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const subject = await getSubjectByIdService(req.params.id);
    res.status(200).json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const subject = await updateSubjectByIdService(req.params.id, req.body);
    res.status(200).json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const result = await deleteSubjectByIdService(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

