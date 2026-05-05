
import util from 'util';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import env from "dotenv"
env.config();

const verifyToken = util.promisify(jwt.verify)

export const verifyAdmin= asyncHandler(async(req,res,next)=>{

    const authHeader = req.headers['authorization'];
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        throw new ApiError(401,"Access token required")
    }
    const token =authHeader.split(" ")[1];
    const payload = await verifyToken(token,process.env.SECRECT_KEY);
    if(payload.user.role!=='ADMIN'){
        throw new ApiError(403,"Admin access requird");
    }
    req.user=payload;
    next();
});
