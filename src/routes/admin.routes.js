import { Router } from "express";
import { addFlight, allFlights, getAllUsers } from "../controllers/admin.controller.js";

const router = new Router();
router.route("/users")
        .get(getAllUsers)

router.route('/flight')
        .post(addFlight)
        .get(allFlights)



export default router;