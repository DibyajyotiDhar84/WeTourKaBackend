import express from 'express';
import { addHotel, bookingGuestList, confirmBookingStatus, deleteHotel, getAllHotels, updateHotels } from '../controllers/hotelManager.controller.js';

const router = express.Router();

router.route('/hotel').post(addHotel)
                      .get(getAllHotels)
                      .patch(updateHotels)
                      .delete(deleteHotel)

router.route('/guestList').get(bookingGuestList)
                          .patch(confirmBookingStatus)

export default router;
