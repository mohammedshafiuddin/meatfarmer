"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.phonePeMerchantId = exports.phonePeClientSecret = exports.phonePeClientVersion = exports.phonePeClientId = exports.phonePeBaseUrl = exports.expoAccessToken = exports.s3Url = exports.s3Region = exports.s3BucketName = exports.s3SecretAccessKey = exports.s3AccessKeyId = exports.encodedJwtSecret = exports.defaultRoleName = exports.jwtSecret = void 0;
exports.jwtSecret = process.env.JWT_SECRET;
exports.defaultRoleName = 'gen_user';
exports.encodedJwtSecret = new TextEncoder().encode(exports.jwtSecret);
exports.s3AccessKeyId = process.env.S3_ACCESS_KEY_ID;
exports.s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
exports.s3BucketName = process.env.S3_BUCKET_NAME;
exports.s3Region = process.env.S3_REGION;
exports.s3Url = process.env.S3_URL;
exports.expoAccessToken = process.env.EXPO_ACCESS_TOKEN;
exports.phonePeBaseUrl = process.env.PHONE_PE_BASE_URL;
exports.phonePeClientId = process.env.PHONE_PE_CLIENT_ID;
exports.phonePeClientVersion = Number(process.env.PHONE_PE_CLIENT_VERSION);
exports.phonePeClientSecret = process.env.PHONE_PE_CLIENT_SECRET;
exports.phonePeMerchantId = process.env.PHONE_PE_MERCHANT_ID;
// export const otpSenderAuthToken = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLTM5OENEMkJDRTM0MjQ4OCIsImlhdCI6MTc0Nzg0MTEwMywiZXhwIjoxOTA1NTIxMTAzfQ.IV64ofVKjcwveIanxu_P2XlACtPeA9sJQ74uM53osDeyUXsFv0rwkCl6NNBIX93s_wnh4MKITLbcF_ClwmFQ0A'
