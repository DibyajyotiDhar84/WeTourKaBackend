import express, { urlencoded } from  'express';
import cors from 'cors';
import userrouter from './routes/user.routes.js';
import adminRouter from './routes/admin.routes.js';
import cookieParser from 'cookie-parser';
import env from 'dotenv'
import { globalErrorHandler } from './middlewares/errorHandlar.middleware.mjs';
env.config();

const app = express();

app.use(express.json());
app.use(urlencoded({extended:true}));
app.use(cors({origin:process.env.ORIGIN_URI}));
app.use(express.static('public'));
app.use(cookieParser());

app.get("/",(req,res)=>{
    res.send("true");
})

//routers--->>>>
app.use("/user",userrouter);

app.use("/admin",adminRouter);


//test of globalErrorHandler--->>>
app.post('/testGEH',(req,res,next)=>{
    const err= new Error('pata nahi kya error hai');
    err.statusCode=401;
    err.status="ufff";
    return next(err);

})
//global errorHandler--->>>
app.use(globalErrorHandler)

export default app;