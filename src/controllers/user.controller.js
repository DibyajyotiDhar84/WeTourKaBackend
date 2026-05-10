import { validationResult } from "express-validator";
import { authenticateUser, isEmailExistsInDB, registerUser } from "../services/user.service.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { flightModel } from "../models/Flight.model.js";
import { ApiResponse } from "../utils/apiResponse.js";


//user's auth controller----------->>>>>>>>
export const register = async (req,res)=>{
    
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        res.status(400).json(
            new ApiError(400,"registration error",errors.array())
        );
    }else{
        const {name,email,password,role,phone}=req.body;
        const user = await registerUser(name,email,password,role,phone);
        res.status(user.statusCode).json(user)
    }
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

// user's flight controllers-------->>>>>>>>

export const searchFlights = asyncHandler(async(req,res)=>{
    const {origin,destination}=req.query;
    // console.log(origin,"-> ",destination);
    if([origin,destination].some((field)=>field.trim()==='')){
        throw new ApiError(400,"please provide origin and destination");
    }

    const flight = await flightModel.findOne({"origin.city":origin,"destination.city":destination});
    if(!flight){
        throw new ApiError(400,"Flight not found from searched origin to destination");
    }

    res.status(200).json(
        new ApiResponse(200,"Flight found",flight,true)
    )

});