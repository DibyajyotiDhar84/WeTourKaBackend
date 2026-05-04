import {validationResult} from 'express-validator'

export const validate=(req,res,next)=>{
    const errors = validationResult(req);
    if(errors.isEmpty()){
        return next();
    }else{
        return res.status(400).json({errorMessage:errors.array()});
    }
}