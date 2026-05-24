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
import { reviewModel } from "../models/reviewModel.js";
import { BookingModel } from "../models/hotelBooking.model.js";
import { hotelModel } from "../models/hotel.model.js";
import {formatedDate} from '../utils/formatDate.js'

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
        const {user_Id, template_Id, date,passengers, total_price}=req.body;
        
        
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
            total_price:total_price
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
    const user_id=req.user?.user_id;

    const { package_id, travellers } = req.body;


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

export const cancelPackage = asyncHandler(async (req, res) => {
  const loggedinUserID = req.user.user_id;
  const { bookingId } = req.query;
 
  const updatedBooking = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      user_id: loggedinUserID,
      booking_status: { $ne: 'Cancelled' }
    },
    {
      $set: { booking_status: 'Cancelled', payment_status: 'Refunded' }
    },
    { new: true }
  );
 
  if (!updatedBooking) {
    throw new ApiError(400, "Cancellation failed. Invalid booking ID, unauthorized, or already cancelled.");
  }
 
  await Package.findByIdAndUpdate(updatedBooking.package_id, {
    $inc: { max_capacity: updatedBooking.travellers.length }
  });
 
  res.status(200).json(
    new ApiResponse(200, "Package booking cancelled successfully", updatedBooking, true)
  );
}); 

//hotel booking

export const hotelBooking = asyncHandler(async(req,res,next)=>{
    
    try{
        const {hotelId,hotelUserId, roomType, travellers, totalPrice, checkInDate, checkOutDate} = req.body;

        const userId = req.user.user_id;
        console.log(hotelUserId);
        

    const booking = await BookingModel.create({
        userId,
        hotelId,
        hotelUserId,
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


    res.status(200).json(new ApiResponse(200,"Booking Confirmed",booking,true))
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


//myBookings-->>
export const travellerBookings = asyncHandler(async(req,res)=>{
    const user_id = req.user.user_id;   

     const [hotelBooking,packageBooking]= await Promise.all([   
    
            BookingModel.find({userId:user_id}).populate('userId','name')
                                .populate('hotelId','name _id'),
    
            Booking.find({user_id:user_id}).populate('user_id','name')
                           .populate('package_id','destination start_date end_date _id')
        ]);
    
    
            const transformdHotels = hotelBooking.map(h=>({
            bookingId:h._id,
            itemId:h.hotelId?._id,
            type:'Hotel',
            title:h.hotelId?.name,
            status:h.status,
            date:`${formatedDate(h.checkInDate)}-->${formatedDate(h.checkOutDate)}`,
            price:h.totalPrice,
            username:h.userId.name
    
        }));
    
            const transformdPackage = packageBooking.map(p=>({
            bookingId:p._id,
            itemId:p.package_id._id,
            type:'Package',
            title:p.package_id.destination,
            status:p.booking_status,
            date:`${formatedDate(p.package_id.start_date)}-->${formatedDate(p.package_id.end_date)}`,
            price:p.total_price,
            username:p.user_id.name
            
    
    
        }));
    
        const allBookings = [
            ...transformdHotels,
            ...transformdPackage
        ].sort((a,b)=>new Date(b.date)-new Date(a.date));

        res.status(200).json(
            new ApiResponse(200,"fetch bookings",{allBookings},true)
        )

});

//write reviews---->>>
export const addReview = asyncHandler(async(req,res)=>{
    const user_id = req.user.user_id;
    const { itemId, category, rating, comment } = req.body;

    if (!user_id) {
      throw new ApiError(401,'Unauthorized. Please log in to leave a review.');
    }

    if (!itemId || !category || !rating || !comment) {
       throw new ApiError(400,'provide neccesity fields');
    }

    const validCategory = category === 'Hotel' ? 'Hotels' : 'Package';

    const newReview = new reviewModel({
      userId:user_id,
      itemId,
      category: validCategory,
      rating, 
      comment
    });

    await newReview.save();

    res.status(201).json(
        new ApiResponse(201,"Review submitted successfully!",newReview,true)
    );
});

export const deleteReview = asyncHandler(async(req,res)=>{

    const { itemId } = req.query;
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