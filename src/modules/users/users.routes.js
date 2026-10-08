import express from "express";
import {createUser, getUsers, getUserById, updateUser, deleteUser, loginUser} from "./users.controller.js";
import { createUserSchema, loginUserSchema, validate } from "./users.validation.js";

import { authMiddleware } from '../../middlewares/auth.js';

const router = express.Router();

router.post("/register", validate(createUserSchema), createUser);
router.post("/login", validate(loginUserSchema), loginUser);

router.use(authMiddleware);
router.param('id', (req, res, next, id) => {
  if (id !== String(req.user.id)) return res.status(404).json({ message: 'Not found' });
  next();
});
router.get("/",getUsers);
router.get("/:id",getUserById);
router.patch("/:id",validate(createUserSchema.partial()),updateUser);
router.delete("/:id",deleteUser);

export default router;
