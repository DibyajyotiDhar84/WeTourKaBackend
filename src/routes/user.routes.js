import express from 'express';
import { authenticate, bookFlight, isEmailExists, register, searchFlights } from '../controllers/user.controller.js';
import {validateRegiter} from '../middlewares/validators/register.validator.mjs';
import {validate} from '../middlewares/validate.mjs';

const router = express.Router();

router.post("/register",validateRegiter, register);

router.post('/auth',authenticate);

router.get('/validateEmail/:email',isEmailExists);

router.get('/searchFlight',searchFlights);

router.post('/bookFlight',bookFlight);



export default router;