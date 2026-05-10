import {Router} from 'express';
import { bookFlight } from '../controllers/traveller.controller.js';

const router = Router();

router.post("/bookFlight",bookFlight);




export default router;