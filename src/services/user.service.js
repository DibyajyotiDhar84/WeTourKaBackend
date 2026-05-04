import { authenticateUser, isEmailExistsInDB, registerUser } from "../controllers/user.controller.js";

export const register = async (req,res)=>{
    const {name,email,password,role,phone}=req.body;
    try {
        const user = await registerUser(name,email,password,role,phone);
        if(!user.success){
            throw user.msg;
        }
        res.status(200).json(user)
    } catch (error) {
        res.status(400).json({message:error,user:null,success:false})
    }
}


export const authenticate = async (req,res)=>{
    const {email,password}=req.body;
    try {
        const user = await authenticateUser(email,password);
        res.status(200).json(user)
    } catch (error) {
        res.status(400).json({message:error,user:null,success:false})
    }
}

export const isEmailExists = async (req, res) => {
    const { email } = req.params;
    const isExists = await isEmailExistsInDB(email);
    res.status(200).json({ isExists });
}