"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payments_controller_1 = require("./payments.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /payments/initiate-token-payment
router.post('/initiate-token-payment', auth_1.verifyToken, payments_controller_1.initiateTokenPayment);
// GET /payments/check-status
router.get('/check-status', payments_controller_1.checkStatus);
router.get('/get-phonepe-creds', payments_controller_1.getPhonepeCreds);
router.post('/mark-payment-success', payments_controller_1.markPaymentSuccess);
router.post('/mark-payment-failure', payments_controller_1.markPaymentFailure);
exports.default = router;
