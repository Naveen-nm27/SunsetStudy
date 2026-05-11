import express from "express";
import {
  createSession,
  deleteSession,
  getSessionById,
  getSessions,
  updateSession,
} from "./sessions.controller.js";

const router = express.Router();

router.post("/", createSession);
router.get("/", getSessions);
router.get("/:id", getSessionById);
router.patch("/:id", updateSession);
router.delete("/:id", deleteSession);

export default router;

