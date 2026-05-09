import { Router } from "express";
import { addFlight, allRunningFlights, getAllUsers } from "../controllers/admin.controller.js";

const router = new Router();

router.get('/allUsers',getAllUsers);
router.post('/addFlight',addFlight);
router.get('/allRunningFlights',allRunningFlights);



export default router;