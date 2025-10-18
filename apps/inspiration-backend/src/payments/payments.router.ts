import { Router } from "express";
import { initiateTokenPayment, checkStatus, getPhonepeCreds, markPaymentSuccess, markPaymentFailure } from "./payments.controller";
import { verifyToken } from "../middleware/auth";

const router = Router();

// POST /payments/initiate-token-payment
router.post('/initiate-token-payment', verifyToken, initiateTokenPayment);

// GET /payments/check-status
router.get('/check-status', checkStatus);


router.get('/get-phonepe-creds', getPhonepeCreds);

router.post('/mark-payment-success', markPaymentSuccess);
router.post('/mark-payment-failure', markPaymentFailure);

export default router;