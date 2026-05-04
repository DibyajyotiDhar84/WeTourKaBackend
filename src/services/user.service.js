import { authenticateUser, isEmailExistsInDB, registerUser } from "../controllers/user.controller.js";

export const register = async (req,res)=>{

    const {name,email,password,role,phone}=req.body;
    const user = await registerUser(name,email,password,role,phone);
    res.status(user.statusCode).json(user)
    
}


export const authenticate = async (req,res)=>{
    const {email,password}=req.body;
    const user = await authenticateUser(email,password);
    res.status(user.statusCode).json(user)
}

export const isEmailExists = async (req, res) => {
    const { email } = req.params;
    const isExists = await isEmailExistsInDB(email);
    res.status(200).json({ isExists });
}