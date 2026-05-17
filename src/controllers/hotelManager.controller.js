import {hotelModel} from '../models/hotel.model.js';
import ApiError from "../utils/apiError.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/apiResponse.js";

export const addHotel = asyncHandler(async(req,res,next)=>{
    
        let hotel = new hotelModel(req.body);

        hotel = await hotel.save();
        
        res.status(201).json(
            new ApiResponse(200, "Hotel added", hotel, true)
        );
    
}
);

export const updateHotels = asyncHandler(async(req,res,next)=>{
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
export const getAllHotels = asyncHandler(async(req,res,next)=>{
    let hotels = await hotelModel.find({});

    if(!hotels){
        throw new ApiError(404,"NO hotels exists");
    }

    res.status(201).json(
        new ApiResponse(201, "All Hotels found", hotels, true)
    );
})