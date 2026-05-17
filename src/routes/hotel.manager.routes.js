import express from 'express';
import { addHotel, getAllHotels, updateHotels } from '../controllers/hotelManager.controller';

const router = express.Router();

router.route('/hotel').post(addHotel)
                      .get(getAllHotels)
                      .patch(updateHotels)

export default router;
