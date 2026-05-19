import { Router } from 'express';
import { 
    addPackage, 
    getAllPManPackages,
    updatePackage
}
from '../controllers/package.controller.js';

const router = Router();

router.route('/').get(getAllPManPackages)
                 .post(addPackage)

router.patch('/update/:id', updatePackage);

export default router;