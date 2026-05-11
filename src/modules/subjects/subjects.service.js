import { Subject } from "./subjects.model.js";

export const createSubjectService = async (data) => {
  const subject = new Subject(data);
  return await subject.save();
};

export const getSubjectsService = async (filter = {}) => {
  return await Subject.find(filter).sort({ createdAt: -1 }).populate("userObjectId");
};

export const getSubjectByIdService = async (id) => {
  return await Subject.findById(id).populate("userObjectId");
};

export const updateSubjectByIdService = async (id, data) => {
  return await Subject.findByIdAndUpdate(id, data, { new: true }).populate(
    "userObjectId"
  );
};

export const deleteSubjectByIdService = async (id) => {
  return await Subject.findByIdAndDelete(id);
};

