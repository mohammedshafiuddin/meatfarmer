

export const jwtSecret: string = process.env.JWT_SECRET as string

export const defaultRoleName = 'gen_user';

export const encodedJwtSecret = new TextEncoder().encode(jwtSecret)

export const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID as string

export const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY as string

export const s3BucketName = process.env.S3_BUCKET_NAME as string

export const s3Region = process.env.S3_REGION as string

export const s3Url = process.env.S3_URL as string


export const expoAccessToken = process.env.EXPO_ACCESS_TOKEN as string;

export const phonePeBaseUrl = process.env.PHONE_PE_BASE_URL as string;

export const phonePeClientId = process.env.PHONE_PE_CLIENT_ID as string;

export const phonePeClientVersion = Number(process.env.PHONE_PE_CLIENT_VERSION as string);

export const phonePeClientSecret = process.env.PHONE_PE_CLIENT_SECRET as string;

export const phonePeMerchantId = process.env.PHONE_PE_MERCHANT_ID as string;

// export const otpSenderAuthToken = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLTM5OENEMkJDRTM0MjQ4OCIsImlhdCI6MTc0Nzg0MTEwMywiZXhwIjoxOTA1NTIxMTAzfQ.IV64ofVKjcwveIanxu_P2XlACtPeA9sJQ74uM53osDeyUXsFv0rwkCl6NNBIX93s_wnh4MKITLbcF_ClwmFQ0A'
