import {Router} from 'express';
import { bookFlight, cancelPackage, findFlightFromID } from '../controllers/traveller.controller.js';
import { bookPackage } from '../controllers/traveller.controller.js';
const router = Router();

router.route('/flights').get(findFlightFromID)
router.post("/bookFlight",bookFlight);

//package.book
router.post('/book', bookPackage);

//package.cancel
router.put("/cancel", cancelPackage);

export default router;