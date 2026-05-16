import express from "express";
import {
  createSession,
  deleteSession,
  getSessionById,
  getSessions,
  updateSession,
} from "./sessions.controller.js";
import { createSessionSchema, updateSessionSchema, validate } from "./sessions.validation.js";
import { injectAuthUserId } from "../../utils/authUser.js";

const router = express.Router();

router.post("/", injectAuthUserId, validate(createSessionSchema), createSession);
router.get("/", getSessions);
router.get("/:id", getSessionById);
router.patch("/:id", validate(updateSessionSchema), updateSession);
router.delete("/:id", deleteSession);

export default router;

