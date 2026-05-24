import express from 'express';
import { addHotel, bookingGuestList, confirmBookingStatus, deleteHotel, getAllHotelDashData, getAllHotels, updateHotels } from '../controllers/hotelManager.controller.js';

const router = express.Router();

router.route('/hotel').post(addHotel)
                      .get(getAllHotels)
                      .patch(updateHotels)
                      .delete(deleteHotel)

router.route('/guestList').get(bookingGuestList)
                          .patch(confirmBookingStatus)


router.route('/dash').get(getAllHotelDashData)

export default router;
