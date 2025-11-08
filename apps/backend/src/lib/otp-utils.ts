import { ApiError } from './api-error';
import { otpSenderAuthToken } from './env-exporter';

const otpStore = new Map<string, string>();

const setOtpCreds = (phone: string, verificationId: string) => {
  otpStore.set(phone, verificationId);
};

export function getOtpCreds(mobile: string) {
  const authKey = otpStore.get(mobile);

  return authKey || null;
}

export const sendOtp = async (phone: string) => {
  if (!phone) {
    throw new ApiError("Phone number is required", 400);
  }
  const reqUrl = `https://cpaas.messagecentral.com/verification/v3/send?countryCode=91&flowType=SMS&mobileNumber=${phone}&timeout=300`;
  const resp = await fetch(reqUrl, {
    headers: {
      authToken: otpSenderAuthToken,
    },
    method: "POST",
  });
  const data = await resp.json();

  if (data.message === "SUCCESS") {
    setOtpCreds(phone, data.data.verificationId);
    return { success: true, message: "OTP sent successfully", verificationId: data.data.verificationId };
  }
  if (data.message === "REQUEST_ALREADY_EXISTS") {
    return { success: true, message: "OTP already sent. Last OTP is still valid" };
  }

  throw new ApiError("Error while sending OTP. Please try again", 500);
};

export async function verifyOtpUtil(mobile: string, otp: string, verifId: string):Promise<boolean> {
    const reqUrl = `https://cpaas.messagecentral.com/verification/v3/validateOtp?&verificationId=${verifId}&code=${otp}`;
  const resp = await fetch(reqUrl, {
    method: "GET",
    headers: {
      authToken: otpSenderAuthToken,
    },
  });

  const rawData = await resp.json();
  if (rawData.data?.verificationStatus === "VERIFICATION_COMPLETED") {
    // delete the verificationId from the local storage
    return true;
  }
  return false;
}