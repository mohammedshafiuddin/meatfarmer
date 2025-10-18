// payments.controller.ts
import { Request, Response } from "express";
import { phonepeAxios } from "../lib/axios";
import {
  phonePeClientId,
  phonePeClientSecret,
  phonePeClientVersion,
  phonePeMerchantId,
} from "../lib/env-exporter";
import crypto, { randomUUID } from "crypto";
import {
  StandardCheckoutClient,
  Env,
  MetaInfo,
  CreateSdkOrderRequest,
} from "pg-sdk-node";
import { db } from '../db/db_index';
import { doctorInfoTable, paymentInfoTable, tokenInfoTable, doctorAvailabilityTable } from '../db/schema';
import { eq, and } from "drizzle-orm";
import paymentService from '../lib/payment-service';
import { ApiError } from '../lib/api-error';


export const initiateTokenPayment = async (req: Request, res: Response) => {
  const { doctorId, date } = req.body;
  const userId = req.user?.userId;

  try {
    // Find the doctor by userId (doctorId from request)
    const doctorRows = await db.select().from(doctorInfoTable).where(eq(doctorInfoTable.userId, doctorId));
    if (!doctorRows.length) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    const consultationFee = doctorRows[0].consultationFee;

    const merchantOrderId = randomUUID();
    // Call payment-service's createPaymentOrder API
    const redirectUrl = "https://your-app.com/payment-redirect";
    const paymentResp = await paymentService.createPaymentOrder(
      Number(consultationFee),
      merchantOrderId,
      redirectUrl,
      String(userId),
      String(doctorId),
      date
    );

    // Save payment details to paymentInfoTable
    await db.insert(paymentInfoTable).values({
      status:  'initiated',
      gateway: 'PhonePe',
      orderId: paymentResp.orderId,
      token: paymentResp.token,
      merchantOrderId,
      payload: {userId, doctorId, date}
    });


    res.json( paymentResp );
  } catch (err: any) {
    console.log(err);
    
    throw new ApiError('Failed to initiate token payment', 500);
  }
};

export const checkStatus = async (req: Request, res: Response) => {
  const paymentId = req.body.paymentId || req.query.paymentId || req.params.paymentId;
  try {
    const statusResp = await paymentService.checkOrderStatus(paymentId);
    res.json(statusResp);
  } catch (err: any) {
    throw new ApiError('Failed to check payment status', 500);
  }
};



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

export const markPaymentSuccess = async (req: Request, res: Response) => {
    const paymentId = req.body.paymentId || req.query.paymentId || req.params.paymentId;
    if (!paymentId) {
      throw new ApiError('Missing paymentId', 400);
    }

    // Get payment info from DB
    const paymentInfo = await db.select().from(paymentInfoTable).where(eq(paymentInfoTable.merchantOrderId, paymentId));
    if (!paymentInfo.length) {
      throw new ApiError('Payment not found', 404);
    }
    const payload = paymentInfo[0].payload as { userId: number; doctorId: number; date: string };
    // Insert new token into token_info table
    // Use a DB transaction for token creation and related work
    await db.transaction(async (tx) => {
      // Get doctor availability for the given doctor and date
      const [availability] = await tx.select().from(doctorAvailabilityTable)
        .where(and(
          eq(doctorAvailabilityTable.doctorId, payload.doctorId),
          eq(doctorAvailabilityTable.date, payload.date)
        ));
      const nextQueueNum = (availability?.filledTokenCount ?? 0) + 1;
      const [newToken] = await tx.insert(tokenInfoTable).values({
        doctorId: payload.doctorId,
        userId: payload.userId,
        tokenDate: payload.date,
        queueNum: nextQueueNum,
        createdAt: new Date().toISOString(),
        paymentId: paymentInfo[0].id,
      }).returning();
      // Update doctor availability: increment filledTokenCount
      await tx.update(doctorAvailabilityTable)
        .set({ filledTokenCount: nextQueueNum })
        .where(and(
          eq(doctorAvailabilityTable.doctorId, payload.doctorId),
          eq(doctorAvailabilityTable.date, payload.date)
        ));
      // ...other work can be done here in the transaction...
    });

    res.json({ message: 'Payment marked as success', paymentId, payload, });

};

export const markPaymentFailure = async (req: Request, res: Response) => {
    const paymentId = req.body.paymentId || req.query.paymentId || req.params.paymentId;
    console.log({paymentId})
    
    if (!paymentId) {
      throw new ApiError('Missing paymentId', 400);
    }
    await db.update(paymentInfoTable)
      .set({ status: 'failure' })
      .where(eq(paymentInfoTable.merchantOrderId, paymentId));
    res.json({ message: 'Payment marked as failure', paymentId });
};

export const getPhonepeCreds = async (req: Request, res: Response) => {
  try {
    const creds = {
      clientId: phonePeClientId,
      clientVersion: phonePeClientVersion,
      merchantId: phonePeMerchantId,
    };
    res.json(creds);
  } catch (err: any) {
    throw new ApiError('Failed to fetch PhonePe credentials', 500);
  }
};
