"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageUploadS3 = void 0;
exports.deleteImageUtil = deleteImageUtil;
exports.generateSignedUrlFromS3Url = generateSignedUrlFromS3Url;
exports.getOriginalUrlFromSignedUrl = getOriginalUrlFromSignedUrl;
exports.generateSignedUrlsFromS3Urls = generateSignedUrlsFromS3Urls;
// import { s3A, awsBucketName, awsRegion, awsSecretAccessKey } from "../lib/env-exporter"
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const signed_url_cache_1 = __importDefault(require("./signed-url-cache"));
const env_exporter_1 = require("./env-exporter");
const s3Client = new client_s3_1.S3Client({
    region: env_exporter_1.s3Region,
    //   endpoint: 'https://axwzpqa4dwjl.compat.objectstorage.ap-hyderabad-1.oraclecloud.com/',
    endpoint: env_exporter_1.s3Url,
    forcePathStyle: true, // Required for Oracle Cloud
    credentials: {
        accessKeyId: env_exporter_1.s3AccessKeyId,
        secretAccessKey: env_exporter_1.s3SecretAccessKey,
    },
});
exports.default = s3Client;
const imageUploadS3 = async (body, type, key) => {
    // const key = `${category}/${Date.now()}`
    const command = new client_s3_1.PutObjectCommand({
        Bucket: env_exporter_1.s3BucketName,
        Key: key,
        Body: body,
        ContentType: type,
    });
    const resp = await s3Client.send(command);
    const imageUrl = `${env_exporter_1.s3Url}${key}`;
    return imageUrl;
};
exports.imageUploadS3 = imageUploadS3;
async function deleteImageUtil(bucket = env_exporter_1.s3BucketName, ...keys) {
    if (keys.length === 0) {
        return true;
    }
    try {
        const deleteParams = {
            Bucket: bucket,
            Delete: {
                Objects: keys.map((key) => ({ Key: key })),
                Quiet: false,
            }
        };
        const deleteCommand = new client_s3_1.DeleteObjectsCommand(deleteParams);
        await s3Client.send(deleteCommand);
        return true;
    }
    catch (error) {
        console.error("Error deleting image:", error);
        throw new Error("Failed to delete image");
        return false;
    }
}
/**
 * Generate a signed URL from an S3 URL
 * @param s3Url The full S3 URL (e.g., https://bucket-name.s3.region.amazonaws.com/path/to/object)
 * @param expiresIn Expiration time in seconds (default: 259200 seconds = 3 days)
 * @returns A pre-signed URL that provides temporary access to the object
 */
async function generateSignedUrlFromS3Url(s3Url, expiresIn = 259200) {
    if (!s3Url) {
        return '';
    }
    try {
        // Check if we have a cached signed URL
        const cachedUrl = signed_url_cache_1.default.get(s3Url);
        if (cachedUrl) {
            // Found in cache, return it
            return cachedUrl;
        }
        // Not in cache, generate a new signed URL
        // Extract the key from the S3 URL
        // Format: https://bucket-name.s3.region.amazonaws.com/path/to/object
        const urlObj = new URL(s3Url);
        const path = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
        // Create the command to get the object
        const command = new client_s3_1.GetObjectCommand({
            Bucket: env_exporter_1.s3BucketName,
            Key: path,
        });
        // Generate the signed URL
        const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn });
        // Cache the signed URL with TTL matching the expiration time (convert seconds to milliseconds)
        signed_url_cache_1.default.set(s3Url, signedUrl, (expiresIn * 1000) - 60000); // Subtract 1 minute to ensure it doesn't expire before use
        return signedUrl;
    }
    catch (error) {
        console.error("Error generating signed URL:", error);
        throw new Error("Failed to generate signed URL");
    }
}
/**
 * Get the original S3 URL from a signed URL
 * @param signedUrl The signed URL
 * @returns The original S3 URL if found in cache, otherwise null
 */
function getOriginalUrlFromSignedUrl(signedUrl) {
    if (!signedUrl) {
        return null;
    }
    // Try to find the original URL in our cache
    const originalUrl = signed_url_cache_1.default.getOriginalUrl(signedUrl);
    return originalUrl || null;
}
/**
 * Generate signed URLs for multiple S3 URLs
 * @param s3Urls Array of S3 URLs or null values
 * @param expiresIn Expiration time in seconds (default: 259200 seconds = 3 days)
 * @returns Array of signed URLs (empty strings for null/invalid inputs)
 */
async function generateSignedUrlsFromS3Urls(s3Urls, expiresIn = 259200) {
    if (!s3Urls || !s3Urls.length) {
        return [];
    }
    try {
        // Process URLs in parallel for better performance
        const signedUrls = await Promise.all(s3Urls.map(url => generateSignedUrlFromS3Url(url, expiresIn).catch(() => '')));
        return signedUrls;
    }
    catch (error) {
        console.error("Error generating multiple signed URLs:", error);
        // Return an array of empty strings with the same length as input
        return s3Urls.map(() => '');
    }
}
