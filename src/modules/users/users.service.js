import {User} from "./users.model.js";
import bcrypt from "bcryptjs";
import { Subject } from '../subjects/subjects.model.js';
import { Topic } from '../topics/topics.model.js';
import { Session } from '../sessions/sessions.model.js';
import { Block } from '../blocks/blocks.model.js';
import { Todo } from '../todos/todos.model.js';

export const createUserService = async (data) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.userPassword, salt);
    const user = new User({ ...data, userPassword: hashedPassword });
    return await user.save();
}

export const getUserService = async (id) => {
    return await User.find({ _id: id }).lean();
}

export const getUserByIdService = async(id) => {
    return await User.findById(id);
}

export const deleteUserByIdService = async(id) => {
    const related = await Promise.all([Subject, Topic, Session, Block, Todo].map(Model => Model.exists({ userObjectId: id })));
    if (related.some(Boolean)) { const error = new Error('Remove your study data and tasks before deleting your account.'); error.status = 409; throw error; }
    return await User.findByIdAndDelete(id);
}

export const updateUserByIdService = async(id,data) =>{
    const clean = { ...data };
    if (clean.userPassword) clean.userPassword = await bcrypt.hash(clean.userPassword, 10);
    return await User.findByIdAndUpdate(id,clean,{new:true, runValidators:true});
}
