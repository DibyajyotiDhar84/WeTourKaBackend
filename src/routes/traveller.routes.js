import {Router} from 'express';
import { bookFlight, findFlightFromID,cancelBookedFlight,searchFlightPNR, hotelBooking, cancelBooking } from '../controllers/traveller.controller.js';
import { bookPackage } from '../controllers/traveller.controller.js';
import { handleChatMessage } from '../controllers/chatbot.controller.js';
const router = Router();

//flights routes--->>>
router.route('/flights').get(findFlightFromID)
                        .post(bookFlight)
                        .patch(cancelBookedFlight)


router.route('/flight/bookingDetails').get(searchFlightPNR)


//package routes--->>>
router.post('/book', bookPackage);


//hotel routes----->
router.route('/hotel').post(hotelBooking)
                      .patch(cancelBooking)


//chatWithBot route-->>>
router.route('/chatAi').post(handleChatMessage)


export default router;