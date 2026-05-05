import express from 'express';
import { authenticate, isEmailExists, register } from '../controllers/user.controller.js';
import {validateRegiter} from '../middlewares/validators/register.validator.mjs';
import {validate} from '../middlewares/validate.mjs';

const router = express.Router();

router.post("/register",validateRegiter,validate, register);

router.post('/auth',authenticate);

router.get('/validateEmail/:email',isEmailExists);



export default router;