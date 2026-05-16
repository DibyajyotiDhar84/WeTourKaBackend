import {Router} from 'express';
import { bookFlight, findFlightFromID,cancelBookedFlight,searchFlightPNR } from '../controllers/traveller.controller.js';
import { bookPackage } from '../controllers/traveller.controller.js';
const router = Router();

//flights routes--->>>
router.route('/flights').get(findFlightFromID)
                        .post(bookFlight)
                        .patch(cancelBookedFlight)


router.route('/flight/bookingDetails').get(searchFlightPNR)


//package routes--->>>
router.post('/book', bookPackage);


export default router;