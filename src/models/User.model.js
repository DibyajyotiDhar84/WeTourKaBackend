import  { Schema, model } from "mongoose";

const userSchema = new Schema({
    // uid:{
    //     type:Schema.Types.ObjectId,
    //     unique:true
    // },
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
        required:true
    }

})

export const UserModel = model('users',userSchema);