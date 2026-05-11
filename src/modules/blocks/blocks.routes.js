import express from "express";
import {
  createBlock,
  deleteBlock,
  getBlockById,
  getBlocks,
  updateBlock,
} from "./blocks.controller.js";
import { createBlockSchema, updateBlockSchema, validate } from "./blocks.validation.js";

const router = express.Router();

router.post("/", validate(createBlockSchema), createBlock);
router.get("/", getBlocks);
router.get("/:id", getBlockById);
router.patch("/:id", validate(updateBlockSchema), updateBlock);
router.delete("/:id", deleteBlock);

export default router;

