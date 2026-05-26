import { Router } from "express";
import { addFlight, allFlights, cancelFlight, getAllAdminDashData, getAllHotels,  getAllHPFBookings, getAllPackages, getAllUsers, updateUserRole } from "../controllers/admin.controller.js";


const router = new Router();


router.route("/users")
        .get(getAllUsers)
        .patch(updateUserRole)

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

router.route('/dash')
        .get(getAllAdminDashData)


export default router;