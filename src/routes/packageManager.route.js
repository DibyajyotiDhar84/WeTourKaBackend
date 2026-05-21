import { Router } from 'express';
import { 
    addPackage, 
    deletePackage, 
    getAllPackages,
    updatePackage,
    bookingGuestList
}
from '../controllers/package.controller.js';

const router = Router();

router.route('/').get(getAllPackages)
                 .post(addPackage)

router.patch('/update/:id', updatePackage);

router.delete('/delete/:id', deletePackage);

router.get('/getGuest', bookingGuestList);

export default router;