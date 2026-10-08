import { Subject } from "./subjects.model.js";
import { Topic } from '../topics/topics.model.js';
import { Session } from '../sessions/sessions.model.js';

export const createSubjectService = async (data) => {
  const subject = new Subject(data);
  return await subject.save();
};

export const getSubjectsService = async (filter = {}) => {
  return await Subject.find(filter).sort({ createdAt: -1 }).lean();
};

export const getSubjectByIdService = async (id) => {
  return await Subject.findById(id).lean();
};

export const updateSubjectByIdService = async (id, data) => {
  return await Subject.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
};

export const deleteSubjectByIdService = async (id) => {
  if (await Topic.exists({ subjectObjectId: id }) || await Session.exists({ subjectObjectId: id })) {
    const error = new Error('Remove this subject\'s topics and sessions first, or archive the subject to preserve your history.');
    error.status = 409; throw error;
  }
  return await Subject.findByIdAndDelete(id);
};

