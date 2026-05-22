import express from 'express';
import { authenticate, getHotelDetails, getHotelsByLoc, getReviewByItemId, isEmailExists, register, searchFlights, searchOrigin } from '../controllers/user.controller.js';
import {validateRegiter} from '../middlewares/validators/register.validator.mjs';
import {validate} from '../middlewares/validate.mjs';
import { searchPackages } from '../controllers/user.controller.js';

const router = express.Router();
router.post("/register",validateRegiter, register);

router.post('/auth',authenticate);

router.get('/validateEmail/:email',isEmailExists);

router.get('/searchFlight',searchFlights);
router.get('/searchOrigin/:searchWord',searchOrigin);

//hotel routes-------------
router.get('/getHotels/:location', getHotelsByLoc);

router.get('/getHotelDetails/:id', getHotelDetails);

//get hotels or packages review routes-->>>

router.get('/reviews',getReviewByItemId);

//package.search
router.get('/searchPackage', searchPackages);

export default router;