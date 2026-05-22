import { Router } from "express";
import { addFlight, allFlights, cancelFlight, getAllHotels,  getAllHPFBookings, getAllPackages, getAllUsers } from "../controllers/admin.controller.js";


const router = new Router();
router.route("/users")
        .get(getAllUsers)

router.route('/flight')
        .post(addFlight)
        .get(allFlights)
        .patch(cancelFlight)


router.route('/hotel')
        .get(getAllHotels)


router.route('/TourPackage')
        .get(getAllPackages)

router.route('/all')
        .get(getAllHPFBookings)


export default router;