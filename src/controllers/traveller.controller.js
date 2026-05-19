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

    const loggedinEmail=req.user.email;
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

        const [bookedFlight]= await flightBookingModel.create([{
            user_id:user_Id,
            instance_id:instance._id,
            passengers:passengerIds,
            total_Price
        }],{session});
       

        const bookedRes = await flightBookingModel.findById(bookedFlight._id).session(session)
                                                                            .populate({path: 'instance_id',model: 'FlightInstance',populate: {path: 'template_id',model: 'flights'}})
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

export const searchFlightPNR = asyncHandler(async(req,res)=>{
    const userId = req.user.user_id;
    const userRole = req.user.role;
    if(!userId || userRole!=='TRAVELLER' ){
        throw new ApiError(401,"unauthorized access")
    }
    const bookedFlightDetails = await flightBookingModel.find({user_id:userId}).populate({path: 'instance_id',model: 'FlightInstance',populate: {path: 'template_id',model: 'flights'}})
                                                                                  .populate('passengers');

    if(!bookedFlightDetails){
        throw new ApiError(404,"booked flight details not found with given userId");
    }

    res.status(200).json(
        new ApiResponse(200,"details fetched successfully",bookedFlightDetails,true)
    )
});

export const cancelBookedFlight = asyncHandler(async(req,res)=>{
    const {pnr_number} = req.query;
       
    
    if(!pnr_number){
        throw new ApiError(404,"pnr not found");
    }
    const flightDetails = await flightBookingModel.findOne({pnr_number:pnr_number})
                                                  .populate({path: 'instance_id',model: 'FlightInstance',populate: {path: 'template_id',model: 'flights'}})
                                                  .populate('passengers')

    if(!flightDetails){
        throw new ApiError(404, "flight Details not found");
    }

    if(flightDetails.booking_status=='Cancelled'){
        throw new ApiError(400,"This booking is already cancelled");
    }

    if (flightDetails.instance_id?.booked_seats?.length) {
        const passengersSeats = flightDetails.passengers.map(p=>p.seat);
        flightDetails.instance_id.booked_seats = flightDetails.instance_id.booked_seats
                                                                          .filter(seat=>!passengersSeats.includes(seat));
        await flightDetails.instance_id.save();
    }

    flightDetails.booking_status='Cancelled';
    await flightDetails.save();

    res.status(200).json(
        new ApiResponse(200,"Booking cancelled successfully",flightDetails,true)
    )
});

//package booking
export const bookPackage = asyncHandler(async (req, res) => {
    const loggedinUserID=req.user.user_id;

    const { package_id, travellers, user_id } = req.body;

    if(loggedinUserID !== user_id){
        throw new ApiError(400,"tampering done in token");
    }

    const pkg = await Package.findById(package_id);
    if (!pkg) throw new ApiError(404,"Package not found");

    if (!travellers || travellers.length === 0) {
      //return res.status(400).json({ message: "Traveller details are required" });
      throw new ApiError(400,"Traveller details are required");
    }

    if (pkg.max_capacity < travellers.length) {
      //return res.status(400).json({ message: "Not enough slots available" });
      throw ApiError(400, "Not enough slots available");
    }

    const createdTravellers = await Traveller.insertMany(travellers);
    const travellerIds = createdTravellers.map(t => t._id);

    const newBooking = new Booking({
      user_id: user_id || req.user?.user_id, 
      package_id,
      travellers: travellerIds, // Array of the newly generated IDs
      booking_status: 'Confirmed' 
    });

     await newBooking.save();
     const savedBooking = await Booking.findOne(newBooking._id).populate("package_id")
                                                                .populate("travellers").lean();
    
    res.status(201).json(
        new ApiResponse(201,"Booking successfull", {booking: savedBooking},true)
    );

});

//hotel booking

export const hotelBooking = asyncHandler(async(req,res,next)=>{
    
    try{
        const {hotelId, roomType, travellers, totalPrice, checkInDate, checkOutDate} = req.body;
        console.log(req.user);

        const userId = req.user._id || req.user.user._id;

    const booking = await BookingModel.create({
        userId,
        hotelId,
        travellers,
        totalPrice,
        roomType,
        checkInDate,
        checkOutDate,
        numRoomsBooked: travellers.length
    });
    const roomsKey = `roomsAvailable.${roomType}`;

    const updateHotel = await hotelModel.findByIdAndUpdate(
        hotelId,
        {$inc:{[roomsKey]: -travellers.length}},
        {new:true}
    );
    if(!updateHotel){
        throw new ApiError(404, "Hotel not found during update");
    }


    res.status(201).json(new ApiResponse(201,"Booking Confirmed",booking,true))
    }catch(error){
        throw  new ApiError(500, "Booking not confimred", error);
    }
    


})

export const cancelBooking = asyncHandler(async(req,res,next)=>{
   const { id }= req.query;

    if(!id){
       
        throw new ApiError(404,"Id required");
    }

    const booking = await BookingModel.findById( id);

    if(!booking){
       
        throw new ApiError(404,"Booking not found");
    }

    if(booking.status === "cancelled"){

        throw new ApiError(400,"You have already cancelled your booking", null, false);
    }
    const roomFiled = `roomsAvailable.${booking.roomType}`;
    await hotelModel.findByIdAndUpdate(booking.hotelId, {
        $inc: {[roomFiled]: booking.numRoomsBooked}
    });

    booking.status = "cancelled";
    await booking.save();

    
    res.status(200).json(new ApiResponse(201,"Booking cancelled and rooms restored", null ,true));

});

//hotel Review 
export const AddReview = asyncHandler(async(req,res)=>{

    const { itemId, category, rating, comment } = req.body;
    const userId = req.user.user_id;

    if (!itemId || !category || !rating || !comment) {
      throw new ApiError(400,"All feilds are required");
    }

    const newReview = await reviewModel.create({
      userId,
      itemId,
      category,
      rating,
      comment
    });

    res.status(201).json(
        new ApiResponse(201,"review added successFully",{review:newReview},true)
    )

});

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

export const deleteReview = asyncHandler(async(req,res)=>{

    const { itemId } = req.params;
    const userId = req.user.user_id;

    const deletedReview = await reviewModel.findOneAndDelete({
      userId: userId,
      itemId: itemId
    });

    if (!deletedReview) {
     throw new ApiError(404,"review not found");
    }

    res.status(200).json(
        new ApiResponse(200,"Review deleted successfully and ratings updated")
    )
});