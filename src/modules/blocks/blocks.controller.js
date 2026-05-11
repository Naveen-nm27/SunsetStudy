import {
  createBlockService,
  deleteBlockByIdService,
  getBlockByIdService,
  getBlocksService,
  updateBlockByIdService,
} from "./blocks.service.js";

export const createBlock = async (req, res) => {
  try {
    const block = await createBlockService(req.body);
    res.status(201).json(block);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBlocks = async (req, res) => {
  try {
    const { userObjectId, type, date, recurring } = req.query;
    const filter = {};
    if (userObjectId) filter.userObjectId = userObjectId;
    if (type) filter.type = type;
    if (date) filter.date = new Date(date);
    if (recurring !== undefined) filter.recurring = recurring === "true";

    const blocks = await getBlocksService(filter);
    res.status(200).json(blocks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBlockById = async (req, res) => {
  try {
    const block = await getBlockByIdService(req.params.id);
    res.status(200).json(block);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBlock = async (req, res) => {
  try {
    const block = await updateBlockByIdService(req.params.id, req.body);
    res.status(200).json(block);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteBlock = async (req, res) => {
  try {
    const result = await deleteBlockByIdService(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

