import express from "express";
import {createUser, getUsers, getUserById, updateUser, deleteUser} from "./users.controller.js";
import { createUserSchema, validate } from "./users.validation.js";

const router = express.Router();

router.post("/", validate(createUserSchema), createUser);
router.get("/",getUsers);
router.get("/:id",getUserById);
router.patch("/:id",updateUser);
router.delete("/:id",deleteUser);

export default router;