
import util from 'util';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import env from "dotenv"
env.config();

const verifyToken = util.promisify(jwt.verify)

export const verifyAdmin= asyncHandler(async(req,res,next)=>{

    // const authHeader = req.headers['authorization'];
    const token = req.cookies.auth_token;
    // if(!authHeader || !authHeader.startsWith("Bearer ")){
    //     throw new ApiError(401,"Access token required")
    // }
     if(!token){
       throw new ApiError(401,"Access token required")
    }
    // const token =authHeader.split(" ")[1];    
    const payload = await verifyToken(token,process.env.SECRECT_KEY);    
    if(payload.user.role!=='ADMIN'){
        throw new ApiError(403,"Admin access requird");
    }
    req.user=payload.user;
    next();
});

export const verifyTraveller= asyncHandler(async(req,res,next)=>{
    // const authHeader = req.headers['authorization'];
        
    // if(!authHeader || !authHeader.startsWith('Bearer')){
    //     throw new ApiError(401,"Access token required");
    // }
    // const token = authHeader.split(" ")[1];
    
    
    const token = req.cookies.auth_token;   
    if(!token){
       throw new ApiError(401,"Access token required")
    }
    
    const payload = await verifyToken(token,process.env.SECRECT_KEY);
    if(payload.user.role!=='TRAVELLER'){
        throw new ApiError(403,"Traveller access required");
    }
    req.user=payload.user;
    next();
});

export const verifyHotelManager= asyncHandler(async(req,res,next)=>{
    // const authHeader = req.headers['authorization'];
    // if(!authHeader || !authHeader.startsWith('Bearer')){
    //     throw new ApiError(401,"Access token required");
    // }
    // const token = authHeader.split(" ")[1];
    const token = req.cookies.auth_token;
    if(!token){
       throw new ApiError(401,"Access token required")
    }
    const payload = await verifyToken(token,process.env.SECRECT_KEY);
    if(payload.user.role!=='HOTEL_MANAGER'){
        throw new ApiError(403,"HOTEL_MANAGER access required");
    }
    req.user=payload.user;
    next();
});

export const verifyPackageManager= asyncHandler(async(req,res,next)=>{
    // const authHeader = req.headers['authorization'];
    // if(!authHeader || !authHeader.startsWith('Bearer')){
    //     throw new ApiError(401,"Access token required");
    // }
    // const token = authHeader.split(" ")[1];
    const token = req.cookies.auth_token;
    if(!token){
       throw new ApiError(401,"Access token required")
    }
    const payload = await verifyToken(token,process.env.SECRECT_KEY);
    if(payload.user.role!=='PACKAGE_MANAGER'){
        throw new ApiError(403,"PACKAGE_MANAGER access required");
    }
    req.user=payload.user;
    next();
});


export const authmiddle= asyncHandler(async(req,res,next)=>{

    const token = req.cookies.auth_token;
     if(!token){
       throw new ApiError(401,"Access token required")
    }  
    const payload = await verifyToken(token,process.env.SECRECT_KEY);        
    req.user=payload.user;
    next();
});
