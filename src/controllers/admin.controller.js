import { flightModel } from '../models/Flight.model.js';
import { UserModel } from '../models/User.model.js';
import ApiError from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';

export const getAllUsers= asyncHandler(async(req,res)=>{

    const users = await UserModel.find().select("-password");
    if(!users)throw new ApiError(404,"could not find users");
    

    res.status(200).json(
        new ApiResponse(200,"users fetched sucessfully",users,true)
    )

});



export const addFlight =asyncHandler(async(req,res)=>{

    const {
        flight_number, airline, origin, destination,
        departure_time, arrival_time, aircraft,status, crew
    } = req.body;

    const existingFlight = await flightModel.findOne({flight_number,departure_time});
    if(existingFlight){
        throw new ApiError(400,"A flight with this number at this time already exists.")
    }

    const seats = [];
    const rows = Math.ceil(aircraft.capacity / 6); // 6 seats per row (A-F)
    const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

    for (let i = 1; i <= rows; i++) {
        for (let letter of seatLetters) {
            if (seats.length < aircraft.capacity) {
                let seatClass = "Economy";
                if (i <= 2) seatClass = "First";
                else if (i <= 5) seatClass = "Business";

                    seats.push({
                        seat_number: `${i}${letter}`,
                        class: seatClass,
                        is_available: true
                    });
                }
            }
        }

    
        const newFlight = await flightModel.create({
            flight_number,
            airline,
            origin,
            destination,
            departure_time,
            arrival_time,
            aircraft,
            status,
            seats,
            crew
        });

        return res.status(201).json(
            new ApiResponse(201,"Flight created sucessfully",newFlight,true)
        );

});

export const allFlights=asyncHandler(async(req,res)=>{
    const fl= await flightModel.find();
    if(!fl){
        throw new ApiError(404,"No flights");
    }

    res.status(200).json(
        new ApiResponse(200,"All flights fetch successfully",fl,true)
    )

});

export const allRunningFlights= asyncHandler(async(req,res)=>{
    const allFlights = await flightModel.find({status:{$ne:"Cancelled"}});
    if(!allFlights){
        throw new ApiError(404,"No running flights");
    }

    res.status(200).json(
        new ApiResponse(200,"all running flights fetch sucessfully",allFlights,true)
    )

});

