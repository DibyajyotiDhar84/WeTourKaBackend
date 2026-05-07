import { Router } from "express";
import { addFlight, getAllUsers } from "../controllers/admin.controller.js";

const router = new Router();

router.get('/allUsers',getAllUsers);
router.post('/addFlight',addFlight);



export default router;