import {hotelModel} from '../models/hotel.model.js';
import ApiError from "../utils/apiError.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/apiResponse.js";
import { BookingModel } from '../models/hotelBooking.model.js';




export const addHotel = asyncHandler(async(req,res)=>{
 
        const user_id = req.user.user_id;
        let hotel = new hotelModel({...req.body,user_id});
        await hotel.save();     
        
        res.status(200).json(
            new ApiResponse(200, "Hotel added", hotel, true)
        );
    
}
);

export const updateHotels = asyncHandler(async(req,res)=>{
  const {id} = req.query;

  if(!id){
    throw new ApiError(404,"Id not found");
  }
  let hotels = await hotelModel.findOneAndUpdate({_id:id},{$set:req.body});
  if(!hotels){
    throw new ApiError(404,"NO such hotels found");
  }

  res.status(201).json(
    new ApiResponse(201, "Hotel Found", hotels, true)
  );


})
export const getAllHotels = asyncHandler(async(req,res)=>{
   const user_id=req.user.user_id;
    let hotels = await hotelModel.find({user_id:user_id});

    if(!hotels){
        throw new ApiError(404,"NO hotels exists ");
    }

    res.status(201).json(
        new ApiResponse(201, "All Hotels found", hotels, true)
    );
})

export const bookingGuestList = asyncHandler(async(req,res)=>{
  const user_id=req.user.user_id;
  let bookings = await BookingModel.find({hotelUserId:user_id}).populate('hotelId', 'name location');
  res.status(201).json(
    new ApiResponse(201, "Guest list received", bookings, true)
  )
});

export const confirmBookingStatus = asyncHandler(async(req,res)=>{
  const {bookingId} = req.query;
  const {updatedStatus} = req.body;
  
  let Updatedbooking = await BookingModel.findOneAndUpdate({_id:bookingId},{$set:{status:updatedStatus}},{returnDocument:'after'});
  if(!Updatedbooking){
    throw new ApiError("404","No booking found with this bookingId")
  }

  res.status(200).json(
    new ApiResponse("200","updated successfully",Updatedbooking,true)
  )

});


export const deleteHotel = asyncHandler(async(req,res)=>{
 
  let {id} = req.query;  
 
  if(!id){
      throw new ApiError(400,"Id not found")
  }

  const check = await BookingModel.findOne({hotelId:id});

  if(check){
    throw new ApiError(400,"Hotel with given Id has bookings u can delete after booking completes");
  }
 
  const hotel = await hotelModel.findOneAndDelete({_id:id})
 
  res.status(200).json(
      new ApiResponse(200,"Hotel deleted successfully", null, true)
  );
 
 
})