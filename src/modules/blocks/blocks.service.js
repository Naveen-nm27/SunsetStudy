import { Block } from "./blocks.model.js";

export const createBlockService = async (data) => {
  const block = new Block(data);
  return await block.save();
};

export const getBlocksService = async (filter = {}) => {
  return await Block.find(filter)
    .sort({ date: -1, startTime: -1 })
    .populate("userObjectId");
};

export const getBlockByIdService = async (id) => {
  return await Block.findById(id).populate("userObjectId");
};

export const updateBlockByIdService = async (id, data) => {
  return await Block.findByIdAndUpdate(id, data, { new: true }).populate(
    "userObjectId"
  );
};

export const deleteBlockByIdService = async (id) => {
  return await Block.findByIdAndDelete(id);
};

