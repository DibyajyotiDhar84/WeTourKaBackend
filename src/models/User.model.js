import  { Schema, model } from "mongoose";
import bcrypt from 'bcrypt';

const userSchema = new Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    name:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        required:true,
        enum:['ADMIN','TRAVELLER','HOTEL_MANAGER',"PACKAGE_MANAGER"]
    },
    phone:{
        type:String,
        required:true,
    }

},{timestamps:true});

userSchema.methods.isCorrectPassword = async function (password) {
    return await bcrypt.compare(password,this.password);  
}

export const UserModel = model('users',userSchema);