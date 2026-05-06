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