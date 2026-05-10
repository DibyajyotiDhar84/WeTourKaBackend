import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { flightModel } from "../models/Flight.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { passengerModel } from "../models/passenger.model.js";
import { flightBookingModel } from "../models/flightBooking.model.js";
import { UserModel } from "../models/User.model.js";


//Travellers flights controller--------->>>>>>>>>>>>>>

export const bookFlight = asyncHandler(async(req,res)=>{

    console.log(" inside book flight");
    const loggedinEmail=req.user.user.email;
    const session = await mongoose.startSession();
    session.startTransaction();
    

    try{
        const {user_Id, flight_Id, passengers, airline_Prefix, total_Price}=req.body;
        const user=await UserModel.findById(user_Id).session(session);
        
        if(!user || user.role!=='TRAVELLER'){
            throw new ApiError(404,"Traveller can only book flights");
        }

        if(loggedinEmail!==user.email){
            throw new ApiError(404,"inflitration in booking flight");
        }
        
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