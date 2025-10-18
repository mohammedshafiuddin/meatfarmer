import { usePhonepeCreds } from '@/api-hooks/payment.api';
import { useEffect } from 'react';
import PhonePePaymentSDK from 'react-native-phonepe-pg';

export function usePhonepeSdk() {
  const { data: creds, isLoading, isError } = usePhonepeCreds();

  useEffect(() => {
    if (creds && creds.clientId && creds.clientVersion) {
      PhonePePaymentSDK.init('SANDBOX', creds.clientId, creds.clientId, true);
    }
  }, [creds]);

  const startTransaction = async (orderId: string, token: string) => {
    try {
      const request = {
        orderId,
        token,
        merchantId: creds?.merchantId,
        paymentMode: { type: 'PAY_PAGE' }
      };
      const stringReq = JSON.stringify(request);
      const response = await PhonePePaymentSDK.startTransaction(stringReq, null);
      return response;
    } catch (error) {
      throw error;
    }
  };

  return { startTransaction, isLoading, isError, creds };
}
