import { UserModel } from "../models/User.model.js";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import util from "util";
import { ApiResponse } from "../utils/apiResponse.js";
import env from 'dotenv'
env.config();

export const registerUser = async (name,email,password,role,phone)=>{
    

    try {
        console.log("start register");
        const hashedPass=await getHashedPassword(password);
        const user = new UserModel({name,email,password:hashedPass,role,phone});
        const registereduser = await user.save();
        const userTores= await UserModel.findById(registereduser._id).select("-password");
        // console.log("success saving ");
       
        return new ApiResponse(200,"User Succesfully registered",userTores,true);
        
    } catch (error) {
        let err;
        if(error?.errorResponse?.errmsg && error?.errorResponse?.errmsg.match("duplicate key")){
           err =  "user already exists";
        }else{
            console.log(error);
            
            err = "some internal error occured";
        }
        return new ApiResponse(400,err);
    }

}


export const isEmailExistsInDB = async (email)=>{
    try{
    let user= await UserModel.find({email});
    user=user[0];
    if(user){
        return true;
    }

    return false;
   }catch(err){

    return false;

   }
}



 const getHashedPassword= async (password)=>{
    const hashedPass = await bcrypt.hash(password,12);
    return hashedPass;
 }