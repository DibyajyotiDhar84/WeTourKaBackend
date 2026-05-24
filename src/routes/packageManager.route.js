import { Router } from 'express';
import { 
    addPackage, 
    bookingGuestList, 
    deletePackage, 
    getAllPackageDashData, 
    getAllPManPackages,
    updatePackage
}
from '../controllers/package.controller.js';

const router = Router();

router.route('/package').get(getAllPManPackages)
                 .post(addPackage)
                 .patch(updatePackage)
                 .delete(deletePackage)


router.route('/getGuest').get(bookingGuestList)

router.route('/dash').get(getAllPackageDashData)



export default router;