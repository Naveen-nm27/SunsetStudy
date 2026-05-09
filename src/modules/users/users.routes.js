import express from "express";
import {createUser, getUsers, getUserById, updateUser, deleteUser} from "./users.controller.js";

const router = express.Router();

router.post("/",createUser);
router.get("/",getUsers);
router.get("/:id",getUserById);
router.patch("/:id",updateUser);
router.delete("/:id",deleteUser);

