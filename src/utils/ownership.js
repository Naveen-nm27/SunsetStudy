import mongoose from "mongoose";

export const notFound = () => ({ status: 404, body: { message: "Not found" } });

export const findOwnedById = async (Model, id, userId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const doc = await Model.findById(id);
  if (!doc) return null;
  const ownerId = doc.userObjectId?._id ?? doc.userObjectId;
  if (!ownerId || String(ownerId) !== String(userId)) return null;
  return doc;
};
