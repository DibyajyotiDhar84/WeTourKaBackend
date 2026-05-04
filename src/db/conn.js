import mongoose, { Mongoose } from "mongoose";
import { DB_NAME } from "../constants.js";
import env from "dotenv";
env.config();

const connectDb = async ()=>{
    try {

        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log("conn success");
        
    } catch (error) {
        console.log(error);
        
    }

}

export default connectDb;