import { validationResult } from "express-validator";
import { authenticateUser, isEmailExistsInDB, registerUser } from "../services/user.service.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { flightModel } from "../models/Flight.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { flightInstanceModel } from "../models/flightInstance.model.js";
import {Package} from '../models/package.model.js'


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
    console.log(email, password);
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
    const {origin,destination,date}=req.query;
    // console.log(origin,"-> ",destination);
    if(!origin || !destination || !date){
        throw new ApiError(400,"Please provide origin, destination, and travel date");
    }

    const searchDate = new Date(date);
    const dayOfWeek = searchDate.getUTCDay();

    const flights = await flightModel.find({"origin.airport_code":origin,"destination.airport_code":destination,days_of_week: dayOfWeek});
    if(!flights){
        throw new ApiError(400,"Flight not found from searched origin to destination on the particular date");
    }

    const results = await Promise.all(flights.map(async (temp)=>{
        const instance = await flightInstanceModel.findOne({
            template_id:temp._id,
            date:searchDate
        });
        const bookedCount = instance?instance.booked_seats.length : 0;
        return{
            ...temp._doc,
            date:date,
            availableSeats: temp.aircraft.capacity - bookedCount,
            instanceId: instance ? instance._id : null
        };
    }));

    res.status(200).json(
        new ApiResponse(200,"Flight found",results,true)
    )

});

export const searchOrigin= asyncHandler(async(req,res)=>{
    const searchWord =req.params.searchWord;

    if(!searchWord){
        throw new ApiError(400,"provide origin to fetch");
    }
    const searchFlight = await flightModel.find({
        $or: [
            { 'origin.airport_code': { $regex: searchWord, $options: 'i' } },
            { 'destination.airport_code': { $regex: searchWord, $options: 'i' } },
            { 'origin.city': { $regex: searchWord, $options: 'i' } },
            { 'destination.city': { $regex: searchWord, $options: 'i' } }
        ]
    }).select("origin.airport_code destination.airport_code origin.city destination.city -_id").limit(10);

    res.status(200).json(
        new ApiResponse(200,"fetch successfully",searchFlight,true)
    )
});

//package search
export const searchPackages = asyncHandler(async (req, res) => {
    const { destination, start_date } = req.query;
    let query = { status: 'Active' };

    if (destination) {
      query.destination = { $regex: destination, $options: 'i' };
    }

    if (start_date) {
      query.start_date = { $gte: new Date(start_date) };
    }

    const results = await Package.find(query);
    console.log(results);
    res.status(200).json(
        new ApiResponse(200, "Package Found!", results, true));
  }) ;
