"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPhonepeCreds = exports.markPaymentFailure = exports.markPaymentSuccess = exports.checkStatus = exports.initiateTokenPayment = void 0;
const env_exporter_1 = require("../lib/env-exporter");
const crypto_1 = require("crypto");
const db_index_1 = require("../db/db_index");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const payment_service_1 = __importDefault(require("../lib/payment-service"));
const api_error_1 = require("../lib/api-error");
const initiateTokenPayment = async (req, res) => {
    const { doctorId, date } = req.body;
    const userId = req.user?.userId;
    try {
        // Find the doctor by userId (doctorId from request)
        const doctorRows = await db_index_1.db.select().from(schema_1.doctorInfoTable).where((0, drizzle_orm_1.eq)(schema_1.doctorInfoTable.userId, doctorId));
        if (!doctorRows.length) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        const consultationFee = doctorRows[0].consultationFee;
        const merchantOrderId = (0, crypto_1.randomUUID)();
        // Call payment-service's createPaymentOrder API
        const redirectUrl = "https://your-app.com/payment-redirect";
        const paymentResp = await payment_service_1.default.createPaymentOrder(Number(consultationFee), merchantOrderId, redirectUrl, String(userId), String(doctorId), date);
        // Save payment details to paymentInfoTable
        await db_index_1.db.insert(schema_1.paymentInfoTable).values({
            status: 'initiated',
            gateway: 'PhonePe',
            orderId: paymentResp.orderId,
            token: paymentResp.token,
            merchantOrderId,
            payload: { userId, doctorId, date }
        });
        res.json(paymentResp);
    }
    catch (err) {
        console.log(err);
        throw new api_error_1.ApiError('Failed to initiate token payment', 500);
    }
};
exports.initiateTokenPayment = initiateTokenPayment;
const checkStatus = async (req, res) => {
    const paymentId = req.body.paymentId || req.query.paymentId || req.params.paymentId;
    try {
        const statusResp = await payment_service_1.default.checkOrderStatus(paymentId);
        res.json(statusResp);
    }
    catch (err) {
        throw new api_error_1.ApiError('Failed to check payment status', 500);
    }
};
exports.checkStatus = checkStatus;
// export const initiatePayment = async (
//   req: Request | null,
//   res: Response | null
// ) => {
//   const merchantOrderId = randomUUID();
//   const amount = 100;
//   const redirectUrl = "https://www.merchant.com/redirect";
//   const metaInfo = MetaInfo.builder().udf1("udf1").udf2("udf2").build();
//   const request = CreateSdkOrderRequest.StandardCheckoutBuilder()
//     .merchantOrderId(merchantOrderId)
//     .amount(amount)
//     .redirectUrl(redirectUrl)
//     .metaInfo(metaInfo)
//     .build();
//   const resp = await client.createSdkOrder(request);
//   res?.send({data: resp})
// };
const markPaymentSuccess = async (req, res) => {
    const paymentId = req.body.paymentId || req.query.paymentId || req.params.paymentId;
    if (!paymentId) {
        throw new api_error_1.ApiError('Missing paymentId', 400);
    }
    // Get payment info from DB
    const paymentInfo = await db_index_1.db.select().from(schema_1.paymentInfoTable).where((0, drizzle_orm_1.eq)(schema_1.paymentInfoTable.merchantOrderId, paymentId));
    if (!paymentInfo.length) {
        throw new api_error_1.ApiError('Payment not found', 404);
    }
    const payload = paymentInfo[0].payload;
    // Insert new token into token_info table
    // Use a DB transaction for token creation and related work
    await db_index_1.db.transaction(async (tx) => {
        // Get doctor availability for the given doctor and date
        const [availability] = await tx.select().from(schema_1.doctorAvailabilityTable)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.doctorAvailabilityTable.doctorId, payload.doctorId), (0, drizzle_orm_1.eq)(schema_1.doctorAvailabilityTable.date, payload.date)));
        const nextQueueNum = (availability?.filledTokenCount ?? 0) + 1;
        const [newToken] = await tx.insert(schema_1.tokenInfoTable).values({
            doctorId: payload.doctorId,
            userId: payload.userId,
            tokenDate: payload.date,
            queueNum: nextQueueNum,
            createdAt: new Date().toISOString(),
            paymentId: paymentInfo[0].id,
        }).returning();
        // Update doctor availability: increment filledTokenCount
        await tx.update(schema_1.doctorAvailabilityTable)
            .set({ filledTokenCount: nextQueueNum })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.doctorAvailabilityTable.doctorId, payload.doctorId), (0, drizzle_orm_1.eq)(schema_1.doctorAvailabilityTable.date, payload.date)));
        // ...other work can be done here in the transaction...
    });
    res.json({ message: 'Payment marked as success', paymentId, payload, });
};
exports.markPaymentSuccess = markPaymentSuccess;
const markPaymentFailure = async (req, res) => {
    const paymentId = req.body.paymentId || req.query.paymentId || req.params.paymentId;
    console.log({ paymentId });
    if (!paymentId) {
        throw new api_error_1.ApiError('Missing paymentId', 400);
    }
    await db_index_1.db.update(schema_1.paymentInfoTable)
        .set({ status: 'failure' })
        .where((0, drizzle_orm_1.eq)(schema_1.paymentInfoTable.merchantOrderId, paymentId));
    res.json({ message: 'Payment marked as failure', paymentId });
};
exports.markPaymentFailure = markPaymentFailure;
const getPhonepeCreds = async (req, res) => {
    try {
        const creds = {
            clientId: env_exporter_1.phonePeClientId,
            clientVersion: env_exporter_1.phonePeClientVersion,
            merchantId: env_exporter_1.phonePeMerchantId,
        };
        res.json(creds);
    }
    catch (err) {
        throw new api_error_1.ApiError('Failed to fetch PhonePe credentials', 500);
    }
};
exports.getPhonepeCreds = getPhonepeCreds;
