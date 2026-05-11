import express from "express";
import {
  createBlock,
  deleteBlock,
  getBlockById,
  getBlocks,
  updateBlock,
} from "./blocks.controller.js";

const router = express.Router();

router.post("/", createBlock);
router.get("/", getBlocks);
router.get("/:id", getBlockById);
router.patch("/:id", updateBlock);
router.delete("/:id", deleteBlock);

export default router;

