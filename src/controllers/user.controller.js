import { validationResult } from "express-validator";
import { authenticateUser, isEmailExistsInDB, registerUser } from "../services/user.service.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { flightModel } from "../models/Flight.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { passengerModel } from "../models/passenger.model.js";
import { flightBookingModel } from "../models/flightBooking.model.js";


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

export const bookFlight = asyncHandler(async(req,res)=>{

    const session = await mongoose.startSession();
    session.startTransaction();

    try{
        const {user_Id, flight_Id, passengers, airline_Prefix, total_Price}=req.body;
        const flight = await flightModel.findById(flight_Id).session(session);
        if(!flight){
            throw new ApiError(404,"flight with given flightId not exists");
        }
        const availableSeats = flight.getAvailableSeatCount();
        if(availableSeats<passengers.length){
            throw new ApiError(400,"Not enough seats available");
        }

        const passengersDoc=[];
        for(let passenger of passengers){
            const p =new passengerModel(passenger);
            await p.generateTicketNumber(airline_Prefix);
            passengersDoc.push(p);
        }

        const savedPassengers=await passengerModel.insertMany(passengersDoc,{session});
        const passengerIds=savedPassengers.map(p=>p._id);

        const selectedSeats = passengers.map(p=>p.seat);
        for(let seat of selectedSeats){
            await flight.bookSeat(seat);
        }
        await flight.save({session});

        const bookedFlight= await flightBookingModel.create([{
            user_id:user_Id,
            flight_id:flight_Id,
            passengers:passengerIds,
            total_Price
        }],{session});

        await session.commitTransaction();
        res.status(200).json(
            new ApiResponse(200,"flight booked successfully",bookedFlight,true)
        )

    }catch(error){
        await session.abortTransaction();
        throw new ApiError(400,"something went wrong in booking flight",error.message);

    }finally{
        session.endSession();
    }


});