import { createUserService,getUserService,getUserByIdService } from "./users.service.js";


export const createUser = async (req,res) => {
    try{
        const user = await createUserService(req.body);
        res.status(201).json(user)
    } catch (err){
        res.status(500).json({message: err.message});
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