import mongoose from "mongoose";

export const notFound = () => ({ status: 404, body: { message: "Not found" } });

export const findOwnedById = async (Model, id, userId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Model.findOne({ _id: id, userObjectId: userId }).lean();
};
