import express from "express";
import {
  createSubject,
  deleteSubject,
  getSubjectById,
  getSubjects,
  updateSubject,
} from "./subjects.controller.js";

const router = express.Router();

router.post("/", createSubject);
router.get("/", getSubjects);
router.get("/:id", getSubjectById);
router.patch("/:id", updateSubject);
router.delete("/:id", deleteSubject);

export default router;

