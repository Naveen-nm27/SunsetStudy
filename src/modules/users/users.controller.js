import { createUserService,getUserService,getUserByIdService,deleteUserByIdService,updateUserByIdService } from "./users.service.js";
import { User } from "./users.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const createUser = async (req,res) => {
    try{
        const user = await createUserService(req.body);
        res.status(201).json(user)
    } catch (err){
        res.status(500).json({ message: "We couldn't create your account. Please try again." });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { userEmail, userPassword } = req.body;
        const user = await User.findOne({ userEmail });
        if (!user) return res.status(401).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(userPassword, user.userPassword);
        if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.status(200).json({ token, user: { id: user._id, userName: user.userName, userEmail: user.userEmail } });
    } catch (err) {
        res.status(500).json({ message: "We couldn't sign you in. Please try again in a moment." });
    }
};

export const getUsers = async (req,res) => {
    try{
        const Users = await getUserService();
        res.status(200).json(Users);
    } catch(err){
        res.status(500).json({message: err.message});
    }
}

export const getUserById = async (req,res) => {
    try{
        const userById = await getUserByIdService(req.params.id);
        res.status(200).json(userById);
    } catch(err){
        res.status(500).json({message: err.message});
    }
} 

export const deleteUser = async (req,res) => {
    try{
        const deleteUser = await deleteUserByIdService(req.params.id);
        res.status(200).json(deleteUser);
    } catch(err){
        res.status(500).json({message:err.message});
    }
}

export const updateUser = async(req,res) => {
    try{
        const updateUser = await updateUserByIdService(req.params.id,req.body);
        res.status(200).json(updateUser);
    } catch(err){
        res.status(500).json({message:err.message});
    }
}