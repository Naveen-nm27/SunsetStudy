import express from "express";
import {
  createTopic,
  deleteTopic,
  getTopicById,
  getTopics,
  getTopicsDueToday,
  updateTopic,
} from "./topics.controller.js";
import { createTopicSchema, updateTopicSchema, validate } from "./topics.validation.js";
import { injectAuthUserId } from "../../utils/authUser.js";

const router = express.Router();

router.post("/", injectAuthUserId, validate(createTopicSchema), createTopic);
router.get("/due-today", getTopicsDueToday);
router.get("/", getTopics);
router.get("/:id", getTopicById);
router.patch("/:id", validate(updateTopicSchema), updateTopic);
router.delete("/:id", deleteTopic);

export default router;

