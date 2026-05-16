import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { flightModel } from "../models/Flight.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { passengerModel } from "../models/passenger.model.js";
import { flightBookingModel } from "../models/flightBooking.model.js";
import { UserModel } from "../models/User.model.js";
import { flightInstanceModel } from "../models/flightInstance.model.js";
import { Package } from "../models/package.model.js";
import { Traveller } from "../models/travellers.model.js";
import { Booking } from "../models/package.booking.model.js";

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

//package booking
export const bookPackage = asyncHandler(async (req, res) => {
    const loggedinUserID=req.user?.user?.user_id;

    const { package_id, travellers, user_id } = req.body;

     if (!loggedinUserID || loggedinUserID !== user_id) {
        throw new ApiError(403, "Unauthorized: Token mismatch or invalid user session");
    }

    const pkg = await Package.findById(package_id);
    if (!pkg) throw new ApiError(404,"Package not found");

    if (!travellers || travellers.length === 0) {
      //return res.status(400).json({ message: "Traveller details are required" });
      throw new ApiError(400,"Traveller details are required");
    }

    if (pkg.max_capacity < travellers.length) {
      //return res.status(400).json({ message: "Not enough slots available" });
      throw new ApiError(400, "Not enough slots available");
    }

    const createdTravellers = await Traveller.insertMany(travellers);
    const travellerIds = createdTravellers.map(t => t._id);

    const newBooking = new Booking({
      user_id: user_id || req.user?._id, 
      package_id,
      travellers: travellerIds,
      booking_status: 'Confirmed' 
    });

     await newBooking.save();
     const savedBooking = await Booking.findOne(newBooking._id).populate("package_id")
                                                                .populate("travellers").lean();
    
    res.status(201).json(
        new ApiResponse(201,"Booking successfull", {booking: savedBooking},true)
    );

});
