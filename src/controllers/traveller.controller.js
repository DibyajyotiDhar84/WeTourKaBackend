import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { flightModel } from "../models/Flight.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { passengerModel } from "../models/passenger.model.js";
import { flightBookingModel } from "../models/flightBooking.model.js";
import { UserModel } from "../models/User.model.js";
import { flightInstanceModel } from "../models/flightInstance.model.js";


//Travellers flights controller--------->>>>>>>>>>>>>>

export const findFlightFromID = asyncHandler(async(req,res)=>{
    
    const {flightId,fDate} = req.query;
    if(!flightId){
        throw new ApiError(400,"provide flightID");
    }

    const flight = await flightModel.findById(flightId);
    if(!flight){
        throw new ApiError(404,"No flight found with this FlightID");
    }
    const instance = await flightInstanceModel.findOne({
        template_id:flightId,
        date:fDate
    });
    const booked_seats = instance?instance.booked_seats:[];
    const booked_seats_length = instance?instance.booked_seats.length : 0;

    const results = {
        ...flight._doc,
        date:fDate,
        booked_seats,
        available_Seat_count: flight.aircraft.capacity - booked_seats_length,
        instanceId: instance ? instance._id : null
    }

    res.status(200).json(
        new ApiResponse(200,"flight found",results,true)
    )
});

export const bookFlight = asyncHandler(async(req,res)=>{

    const loggedinEmail=req.user.user.email;
    const session = await mongoose.startSession();
    session.startTransaction();
    

    try{
        const {user_Id, template_Id, date,passengers, total_Price}=req.body;
        const searchDate = new Date(date);        
        
        const user=await UserModel.findById(user_Id).session(session);
        
        if(!user || user.role!=='TRAVELLER'){
            throw new ApiError(404,"Traveller can only book flights");
        }

        if(loggedinEmail!==user.email){
            throw new ApiError(404,"inflitration in booking flight");
        }
        
        const flight = await flightModel.findById(template_Id).session(session);
        if(!flight){
            throw new ApiError(404,"flight with given template_Id not exists");
        }

        let instance = await flightInstanceModel.findOne({
            template_id: template_Id, 
            date: searchDate
        }).session(session);

        if(!instance){
            instance= new flightInstanceModel({
                template_id:template_Id,
                date:date,
                booked_seats:[],
                current_price:flight.base_price
            });
        }

        const selectedSeats = passengers.map(p=>p.seat);
        for(let seat of selectedSeats){
            if(instance.booked_seats.includes(seat)){
                throw new ApiError(400,`Seat ${seat} is already booked`);
            }
        }

        if((flight.aircraft.capacity - instance.booked_seats.length)<passengers.length){
            throw new ApiError(400,"Not enough seats available");
        }

        const passengerDoc = passengers.map(p=>{
            const pp = new passengerModel(p);
            pp.generateTicketNumber(flight.airline.iata_code);
            return pp;
        });
        const savedPassengers = await passengerModel.insertMany(passengerDoc,{session});
        const passengerIds = savedPassengers.map(p=> p._id);

        instance.booked_seats.push(...selectedSeats);
        await instance.save({session});

        const bookedFlight= await flightBookingModel.create([{
            user_id:user_Id,
            instance_id:instance._id,
            passengers:passengerIds,
            total_Price
        }],{session});

        const bookedRes = await flightBookingModel.findOne(bookFlight._id).populate("instance_id")
                                                                          .populate("passengers")
                                                                          .lean();

        await session.commitTransaction();
        res.status(200).json(
            new ApiResponse(200,"flight booked successfully",bookedRes,true)
        )

    }catch(error){
        await session.abortTransaction();
        throw new ApiError(400,"Booking failed",error.message);

    }finally{
        session.endSession();
    }


});