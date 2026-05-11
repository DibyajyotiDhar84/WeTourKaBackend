import { Router } from "express";
import { addFlight, allFlights, getAllUsers } from "../controllers/admin.controller.js";

const router = new Router();

router.get('/allUsers',getAllUsers);
router.post('/addFlight',addFlight);
router.get('/allFlights',allFlights);



export default router;