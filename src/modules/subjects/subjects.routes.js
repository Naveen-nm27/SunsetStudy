import express from "express";
import {
  createSubject,
  deleteSubject,
  getSubjectById,
  getSubjects,
  updateSubject,
} from "./subjects.controller.js";
import { createSubjectSchema, updateSubjectSchema, validate } from "./subjects.validation.js";
import { injectAuthUserId } from "../../utils/authUser.js";
import { importSubjects, validateSubjectImport } from './subjects.import.js';

const router = express.Router();
router.post('/import', validateSubjectImport, importSubjects);

router.post("/", injectAuthUserId, validate(createSubjectSchema), createSubject);
router.get("/", getSubjects);
router.get("/:id", getSubjectById);
router.patch("/:id", validate(updateSubjectSchema), updateSubject);
router.delete("/:id", deleteSubject);

export default router;

