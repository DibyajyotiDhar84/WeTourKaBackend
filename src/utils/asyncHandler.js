import ApiError from './apiError.js'

export const asyncHandler=(requestHandler)=>async(req,res,next)=>{
    try {
        await requestHandler(req,res,next);
        
    }catch (error) {
    const statusCode = error instanceof ApiError ? error.statusCode : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
      errors: error.errors || [],
    });
  }

}