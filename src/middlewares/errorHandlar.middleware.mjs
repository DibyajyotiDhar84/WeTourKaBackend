export const globalErrorHandler=(err,req,res,next)=>{

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    console.error('ERROR 💥:', err);

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message || 'An unexpected error occurred on weTour.',
        success: false
    });
}