import redisClient from './redis-client';

// OTP-related constants
const OTP_PREFIX = 'otp:';
const OTP_TTL_SECONDS = 300; // 5 minutes

/**
 * Store OTP in Redis with expiration
 * @param identifier - Email, phone, or user identifier
 * @param otp - The OTP code to store
 * @param ttlSeconds - Optional TTL in seconds (default: 5 minutes)
 * @returns Promise<boolean> - Success status
 */
export async function storeOTP(
  identifier: string,
  otp: string,
  ttlSeconds: number = OTP_TTL_SECONDS
): Promise<boolean> {
  try {
    const key = `${OTP_PREFIX}${identifier}`;
    const success = await redisClient.set(key, otp, ttlSeconds);

    if (success) {
      console.log(`OTP stored for ${identifier} with TTL: ${ttlSeconds}s`);
    } else {
      console.error(`Failed to store OTP for ${identifier}`);
    }

    return success;
  } catch (error) {
    console.error('Error storing OTP:', error);
    return false;
  }
}

/**
 * Retrieve OTP from Redis
 * @param identifier - Email, phone, or user identifier
 * @returns Promise<string | null> - The OTP code or null if not found/expired
 */
export async function getOTP(identifier: string): Promise<string | null> {
  try {
    const key = `${OTP_PREFIX}${identifier}`;
    const otp = await redisClient.get(key);

    if (otp) {
      console.log(`OTP retrieved for ${identifier}`);
    } else {
      console.log(`OTP not found or expired for ${identifier}`);
    }

    return otp;
  } catch (error) {
    console.error('Error retrieving OTP:', error);
    return null;
  }
}

/**
 * Delete OTP from Redis
 * @param identifier - Email, phone, or user identifier
 * @returns Promise<boolean> - Success status
 */
export async function deleteOTP(identifier: string): Promise<boolean> {
  try {
    const key = `${OTP_PREFIX}${identifier}`;
    const success = await redisClient.delete(key);

    if (success) {
      console.log(`OTP deleted for ${identifier}`);
    } else {
      console.log(`OTP not found for deletion: ${identifier}`);
    }

    return success;
  } catch (error) {
    console.error('Error deleting OTP:', error);
    return false;
  }
}

/**
 * Verify OTP by comparing with stored value and optionally delete after verification
 * @param identifier - Email, phone, or user identifier
 * @param providedOTP - The OTP provided by user
 * @param deleteAfterVerification - Whether to delete OTP after successful verification
 * @returns Promise<boolean> - Whether OTP is valid
 */
export async function verifyOTP(
  identifier: string,
  providedOTP: string,
  deleteAfterVerification: boolean = true
): Promise<boolean> {
  try {
    const storedOTP = await getOTP(identifier);

    if (!storedOTP) {
      console.log(`No OTP found for verification: ${identifier}`);
      return false;
    }

    const isValid = storedOTP === providedOTP;

    if (isValid) {
      console.log(`OTP verified successfully for ${identifier}`);

      if (deleteAfterVerification) {
        await deleteOTP(identifier);
        console.log(`OTP deleted after successful verification: ${identifier}`);
      }
    } else {
      console.log(`OTP verification failed for ${identifier}`);
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
}

/**
 * Check if OTP exists for identifier
 * @param identifier - Email, phone, or user identifier
 * @returns Promise<boolean> - Whether OTP exists
 */
export async function hasOTP(identifier: string): Promise<boolean> {
  try {
    const key = `${OTP_PREFIX}${identifier}`;
    return await redisClient.exists(key);
  } catch (error) {
    console.error('Error checking OTP existence:', error);
    return false;
  }
}

/**
 * Get remaining TTL for OTP in seconds
 * @param identifier - Email, phone, or user identifier
 * @returns Promise<number> - TTL in seconds (-2 if key doesn't exist, -1 if no TTL)
 */
export async function getOTPExpiry(identifier: string): Promise<number> {
  try {
    // Note: This would require a TTL method in redis-client.ts
    // For now, we'll return -1 as placeholder
    console.log(`Getting TTL for OTP: ${identifier}`);
    return -1; // Placeholder - would need to implement TTL method in redis-client
  } catch (error) {
    console.error('Error getting OTP expiry:', error);
    return -2;
  }
}