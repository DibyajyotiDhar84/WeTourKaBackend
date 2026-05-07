import ApiError from './apiError.js'

export const asyncHandler=(requestHandler)=>async(req,res,next)=>{
    try {
        await requestHandler(req,res,next);
        
    }catch (error) {
    let statusCode = error instanceof ApiError ? error.statusCode : 500;
    // console.log(error.match("TokenExpiredError"));
    
    if(error.toString().match("TokenExpiredError")){
      statusCode=401;
      error.message="Jwt Expired";
    }
    console.log(error);
   
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
      errors: error.errors || [],
    });
  }

}