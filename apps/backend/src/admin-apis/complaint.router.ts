import { Router } from 'express';
import { getComplaints, resolveComplaint } from './complaint.controller';

const router = Router();

router.get('/', getComplaints);
router.patch('/:id/resolve', resolveComplaint);

export default router;