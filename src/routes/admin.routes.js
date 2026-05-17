import { Router } from "express";
import { addFlight, allFlights, getAllUsers } from "../controllers/admin.controller.js";
import { getAllHotels } from "../controllers/hotelManager.controller.js";

const router = new Router();
router.route("/users")
        .get(getAllUsers)

router.route('/flight')
        .post(addFlight)
        .get(allFlights)


router.route('/hotel')
        .get(getAllHotels)


export default router;