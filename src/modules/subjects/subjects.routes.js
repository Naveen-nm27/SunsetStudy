import express from "express";
import {
  createSubject,
  deleteSubject,
  getSubjectById,
  getSubjects,
  updateSubject,
} from "./subjects.controller.js";
import { createSubjectSchema, updateSubjectSchema, validate } from "./subjects.validation.js";

const router = express.Router();

router.post("/", validate(createSubjectSchema), createSubject);
router.get("/", getSubjects);
router.get("/:id", getSubjectById);
router.patch("/:id", validate(updateSubjectSchema), updateSubject);
router.delete("/:id", deleteSubject);

export default router;

