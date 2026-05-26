import express from 'express';
import { getProfile, logout } from '../controllers/user.controller.js';

const router = express.Router();

router.route('/getprofile').get(getProfile);

router.route('/logout').post(logout);

export default router;