import { Router } from "express";
import { verifyAdmin } from "../middlewares/checkRole.middleware.js";
import { getAllUsers } from "../controllers/admin.controller.js";

const router = new Router();

router.get('/allUsers',verifyAdmin,getAllUsers)



export default router;