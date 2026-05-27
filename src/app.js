import express, { urlencoded } from  'express';
import cors from 'cors';
import {doubleCsrf} from 'csrf-csrf';
import userrouter from './routes/user.routes.js';
import adminRouter from './routes/admin.routes.js';
import travellerRouter from './routes/traveller.routes.js';
import packageManagerRouter from './routes/packageManager.route.js';
import hotelManagerRouter from './routes/hotel.manager.routes.js';
import cookieParser from 'cookie-parser';
import authmerouter from './routes/authme.route.js'
import env from 'dotenv'
import { globalErrorHandler } from './middlewares/errorHandlar.middleware.js';
import {protectedRequestedHandler,verifyRole} from './middlewares/checkRole.middleware.js'

env.config();

const app = express();

app.use(express.json());
app.use(urlencoded({extended:true}));
app.use(cors({
    origin: process.env.ORIGIN_URI,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    exposedHeaders: ['x-csrf-token']
}));
app.use(express.static('public'));
app.use(cookieParser(process.env.COOKIE_SECRET));


export const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
    getSecret: () => process.env.CSRF_SECRET,
    getSessionIdentifier: (req) => {
        return req.cookies.auth_token || 'anonymous-session';
    },
    getTokenFromRequest: (req) => {
        return req.headers['x-csrf-token']; 
    },
    cookieName: 'XSRF-TOKEN',
    cookieOptions: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 1000 * 60 * 60 * 1 
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS']
});

app.get('/api/init-session', (req, res) => {
   const token = generateCsrfToken(req, res);
    return res.json({ status: 'initialized' ,csrfToken:token});
});



// app.use((req, res, next) => {

//     if (req.path.endsWith('/logout')) {
//         return next();
//     }
//     return doubleCsrfProtection(req, res, next);
// });

app.use(doubleCsrfProtection);

//routers--->>>>
app.use("/user",userrouter);
//protected routes-->>>
app.use("/admin",protectedRequestedHandler,verifyRole(["ADMIN"]),adminRouter);

app.use("/hotelManager",protectedRequestedHandler,verifyRole(["HOTEL_MANAGER"]), hotelManagerRouter )

app.use("/traveller",protectedRequestedHandler,verifyRole(["TRAVELLER"]),travellerRouter);

app.use("/package",protectedRequestedHandler,verifyRole(["PACKAGE_MANAGER"]), packageManagerRouter);
app.use("/auth",protectedRequestedHandler,authmerouter);



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