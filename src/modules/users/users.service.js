import {User} from "./users.model.js";

export const createUserService = async (data) => {
    const user = new User(data);
    return await user.save();
}

export const getUserService = async () => {
    return await User.find();
}

export const getUserByIdService = async(id) => {
    return await User.findById(id);
}