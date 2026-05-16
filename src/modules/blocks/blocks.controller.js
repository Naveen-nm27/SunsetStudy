import {
  createBlockService,
  deleteBlockByIdService,
  getBlockByIdService,
  getBlocksService,
  updateBlockByIdService,
} from "./blocks.service.js";
import { Block } from "./blocks.model.js";
import { getAuthUserId, stripUserObjectId } from "../../utils/authUser.js";
import { findOwnedById, notFound } from "../../utils/ownership.js";

const userFilter = (req, query = {}) => {
  const userId = getAuthUserId(req);
  const { type, date, recurring } = query;
  const filter = { userObjectId: userId };
  if (type) filter.type = type;
  if (date) filter.date = new Date(date);
  if (recurring !== undefined) filter.recurring = recurring === "true";
  return filter;
};

export const createBlock = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const block = await createBlockService({ ...req.body, userObjectId: userId });
    res.status(201).json(block);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBlocks = async (req, res) => {
  try {
    const blocks = await getBlocksService(userFilter(req, req.query));
    res.status(200).json(blocks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBlockById = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const owned = await findOwnedById(Block, req.params.id, userId);
    if (!owned) return res.status(404).json(notFound().body);

    const block = await getBlockByIdService(req.params.id);
    res.status(200).json(block);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBlock = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const owned = await findOwnedById(Block, req.params.id, userId);
    if (!owned) return res.status(404).json(notFound().body);

    const block = await updateBlockByIdService(req.params.id, stripUserObjectId(req.body));
    if (!block) return res.status(404).json(notFound().body);
    res.status(200).json(block);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteBlock = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const owned = await findOwnedById(Block, req.params.id, userId);
    if (!owned) return res.status(404).json(notFound().body);

    const result = await deleteBlockByIdService(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
