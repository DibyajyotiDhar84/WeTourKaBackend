import {Router} from 'express';
import { bookFlight, findFlightFromID,cancelBookedFlight,searchFlightPNR, hotelBooking, cancelBooking, AddReview, deleteReview, cancelPackage,bookPackage } from '../controllers/traveller.controller.js';
import { handleChatMessage } from '../controllers/chatbot.controller.js';
const router = Router();

//flights routes--->>>
router.route('/flights').get(findFlightFromID)
                        .post(bookFlight)
                        .patch(cancelBookedFlight)


router.route('/flight/bookingDetails').get(searchFlightPNR)


//package routes--->>>
router.route('/package').post(bookPackage)
                        .patch(cancelPackage)


//hotel routes----->
router.route('/hotel').post(hotelBooking)
                      .patch(cancelBooking)


//hotel reviews routes--->>>>
router.route('/hotel/review').post(AddReview)
                             .delete(deleteReview)


//chatWithBot route-->>>
router.route('/chatAi').post(handleChatMessage)


export default router;