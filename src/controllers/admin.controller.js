import { flightModel } from '../models/Flight.model.js';
import { flightBookingModel } from '../models/flightBooking.model.js';
import { flightInstanceModel } from '../models/flightInstance.model.js';
import { UserModel } from '../models/User.model.js';
import ApiError from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import { Package } from '../models/package.model.js';

export const getAllUsers= asyncHandler(async(req,res)=>{

    const users = await UserModel.find({role:{$ne:"ADMIN"}}).select("-password");
    if(!users)throw new ApiError(404,"could not find users");
    

    res.status(200).json(
        new ApiResponse(200,"users fetched sucessfully",users,true)
    )

});



export const addFlight =asyncHandler(async(req,res)=>{

    const {
            flight_number, airline, origin, destination,departure_time,
            arrival_time, aircraft, days_of_week, base_price
        } = req.body;


    if([flight_number,departure_time,arrival_time].some((f)=>f.trim()=="") || !base_price ||!origin ||!destination){
        throw new ApiError(400,"provide required fields");
    }
    

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
            days_of_week: days_of_week || [0, 1, 2, 3, 4, 5, 6],
            seats,
            base_price
        });

        return res.status(201).json(
            new ApiResponse(201,"Flight created sucessfully",newFlight,true)
        );

});

export const allFlights=asyncHandler(async(req,res)=>{

    const flightInstance= await flightInstanceModel.find().populate('template_id');
    if(!flightInstance){
        throw new ApiError(404,"No flights instances");
    }

    res.status(200).json(
        new ApiResponse(200,"All flights Instances fetch successfully",flightInstance,true)
    )

});

export const cancelFlight=asyncHandler(async(req,res)=>{
    const {fIid}=req.query;
    if(!fIid){
        throw new ApiError(400,"provide flight instance Id")
    }
    const flightIns = await flightInstanceModel.findOne({_id:fIid});
    if(!flightIns){
        throw new ApiError(404,"flight instance couldn't found with given instance id")
    }
    if (flightIns.status === "Cancelled") {
        throw new ApiError(400, "This flight is already cancelled");
    }

    flightIns.status="Cancelled";
    await flightIns.save();

    // const allBookings = await flightBookingModel.find({instance_id:fIid,booking_status:'Confirmed'});

    // for(let booking of allBookings){
        //refund logic--->>
    // }


    await flightBookingModel.updateMany(
        { 
            instance_id: fIid, 
            booking_status: "Confirmed" 
        },
        { 
            $set: { booking_status: "Cancelled" } 
        }
    );



    res.status(200).json(
        new ApiResponse(200,"Flight cancelled successfully",flightIns,true)
    )
});


export const getAllPackages = asyncHandler(async (req, res) => {
  const packages = await Package.find()
                                .populate('user_id', 'name email');
  res.status(200).json(new ApiResponse(200, "All Packages found", packages, true));
});


