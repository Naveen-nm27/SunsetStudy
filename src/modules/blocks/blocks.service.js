import { Block } from "./blocks.model.js";

export const createBlockService = async (data) => {
  const block = new Block(data);
  return await block.save();
};

export const getBlocksService = async (filter = {}) => {
  return await Block.find(filter)
    .sort({ date: -1, startTime: -1 })
    .lean();
};

export const getBlockByIdService = async (id) => {
  return await Block.findById(id).lean();
};

export const updateBlockByIdService = async (id, data) => {
  const block = await Block.findById(id);
  if (!block) return null;
  Object.assign(block, data);
  if (block.startTime === block.endTime) { const error = new Error('Start and end times must differ'); error.status = 400; throw error; }
  if (data.recurring === false) block.days = [];
  await block.save();
  return block;
};

export const deleteBlockByIdService = async (id) => {
  return await Block.findByIdAndDelete(id);
};

