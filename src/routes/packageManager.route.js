import { Router } from 'express';
import { 
    addPackage, 
    getAllPackages,
    updatePackage
}
from '../controllers/package.controller.js';

const router = Router();

router.route('/').get(getAllPackages)
                 .post(addPackage)

router.patch('/update/:id', updatePackage);

export default router;