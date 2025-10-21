import { Router } from 'express';
import { staffLogin } from './staff.controller';

const router = Router();

router.post('/login', staffLogin);

export default router;