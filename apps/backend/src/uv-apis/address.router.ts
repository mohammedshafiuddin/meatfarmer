import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { getUserAddresses, createAddress, updateAddress } from './address.controller';

const router = Router();

router.use(verifyToken);
router.get('/', getUserAddresses);
router.post('/', createAddress);
router.put('/:id', updateAddress);

export default router;