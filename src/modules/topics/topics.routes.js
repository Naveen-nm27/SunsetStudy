import express from "express";
import {
  createTopic,
  deleteTopic,
  getTopicById,
  getTopics,
  getTopicsDueToday,
  updateTopic,
} from "./topics.controller.js";

const router = express.Router();

router.post("/", createTopic);
router.get("/due-today", getTopicsDueToday);
router.get("/", getTopics);
router.get("/:id", getTopicById);
router.patch("/:id", updateTopic);
router.delete("/:id", deleteTopic);

export default router;

