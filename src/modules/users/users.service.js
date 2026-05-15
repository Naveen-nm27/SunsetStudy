import {User} from "./users.model.js";
import bcrypt from "bcryptjs";

export const createUserService = async (data) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.userPassword, salt);
    const user = new User({ ...data, userPassword: hashedPassword });
    return await user.save();
}

export const getUserService = async () => {
    return await User.find();
}

export const getUserByIdService = async(id) => {
    return await User.findById(id);
}

export const deleteUserByIdService = async(id) => {
    return await User.findByIdAndDelete(id);
}

export const updateUserByIdService = async(id,data) =>{
    return await User.findByIdAndUpdate(id,data,{new:true});
}