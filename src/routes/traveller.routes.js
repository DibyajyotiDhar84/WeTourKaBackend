import {Router} from 'express';
import { bookFlight, findFlightFromID } from '../controllers/traveller.controller.js';
import { bookPackage } from '../controllers/traveller.controller.js';
const router = Router();

router.route('/flights').get(findFlightFromID)
router.post("/bookFlight",bookFlight);

//package.book
router.post('/book', bookPackage);


export default router;