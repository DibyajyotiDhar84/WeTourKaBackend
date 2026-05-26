import { validationResult } from "express-validator";
import { isEmailExistsInDB, registerUser } from "../services/user.service.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { flightModel } from "../models/Flight.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { flightInstanceModel } from "../models/flightInstance.model.js";
import {Package} from '../models/package.model.js'
import { hotelModel } from "../models/hotel.model.js";
import { reviewModel } from "../models/reviewModel.js";
import { UserModel } from "../models/User.model.js";
import {generateCsrfToken} from '../app.js'

import jwt from 'jsonwebtoken';
import util from 'util';


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


export const authenticate = asyncHandler(async (req,res)=>{
    const {email,password}=req.body;
    if(!email||!password){
        throw new ApiError(400,"provide email and password")
    }
    const user = await UserModel.findOne({email:email});
    if(!user){
        throw new ApiError(404,"User not Found");
    }

    if(!await user.isCorrectPassword(password)){
            throw new ApiError(400,"Invalid Password")
    }

    const token = await getJWT(user);
    const options={
        httpOnly:true,
        secure:false,
        sameSite:'lax',
        maxAge:1000*60*60*12
    }
    req.cookies.auth_token = token;

    const rotatedCsrfToken=generateCsrfToken(req, res);

    res.status(200).cookie('auth_token',token,options)
                    .json(new ApiResponse(200,"login successfully",{ 
                token, 
                csrfToken: rotatedCsrfToken,
                user: { id: user._id, role: user.role } 
            },true))
    
});

export const isEmailExists = async (req, res) => {
    const { email } = req.params;
    const isExists = await isEmailExistsInDB(email);
    res.status(200).json({ isExists });
}


export const logout = asyncHandler(async(req,res)=>{
    

     const options = {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
    };

    const xsrfOptions = {
        httpOnly: true,
        sameSite: 'lax',
        path: '/'
    };

    return res.status(200)
        .clearCookie("auth_token", options)
        .clearCookie("XSRF-TOKEN", xsrfOptions)
        .json(new ApiResponse(200, "Logged Out Successfully"));

});


export const getProfile= asyncHandler(async(req,res)=>{

    const user_id = req.user.user_id;
    const user = await UserModel.findById({_id:user_id});
    if(!user){
        throw new ApiError(404,"user not found");
    }

    res.status(200).json(
        new ApiResponse(200,"profile fetched successfully",user,true)
    )


});




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

//package controller
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
    // console.log(results);
    res.status(200).json(
        new ApiResponse(200, "Package Found!", results, true));
  }) ;

 //Hotel Controller
  export const getHotelDetails = asyncHandler(async(req,res,next)=>{
    const {id} = req.params;

    const hotel = await hotelModel.findById(id);

    if(!hotel){
        throw new ApiError("This hotel does not exist ")
    }

    res.status(201).json(
        new ApiResponse(200, "Hotel details got", hotel, true)
    );
})

export const getHotelsByLoc = asyncHandler (async(req,res)=>{
    
        const  location  = req.params.location ;   

        if(!location){
            throw new ApiError(400, "Please provide location")
        }
        const query = {location: { $regex:location , $options: "i"}};

        const hotels = await hotelModel.find(query);

        if(!hotels){
            throw new ApiError(404, "Hotel not found in this perticular location")
        }


        res.status(200).json(
            new ApiResponse(200, "Hotel Found", hotels, true)
        );
    
        
}
);

export const getReviewByItemId = asyncHandler(async(req,res)=>{

    const { itemId } = req.query;
    if(!itemId){
        throw new ApiError(400,"Please provide the itemId")
    }
    const reviews = await reviewModel.find({ itemId })
                                     .populate('userId','name')
                                     .sort({ createdAt: -1 });

    if (!reviews || reviews.length === 0) {
      throw new ApiError(404,"No reviews found for this item");
    }

    res.status(200).json(
        new ApiResponse(200,"reviews fetched for the itemId",reviews,true)
    )

});




const getJWT = async (user)=>{
    const signJWT = util.promisify(jwt.sign);
    const payLoad = {
        user:{user_id:user._id,email:user.email,role:user.role}
    }; 
    
    const token = await signJWT(payLoad,process.env.SECRECT_KEY,{ expiresIn: 1000*60*60*12});
    return token;
 }
