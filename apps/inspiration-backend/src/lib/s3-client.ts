// import { s3A, awsBucketName, awsRegion, awsSecretAccessKey } from "../lib/env-exporter"
import { DeleteObjectCommand, DeleteObjectsCommand, PutObjectCommand, S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import signedUrlCache from "./signed-url-cache"
import { s3AccessKeyId, s3Region, s3Url, s3SecretAccessKey, s3BucketName } from "./env-exporter";

const s3Client = new S3Client({
  region: s3Region,
//   endpoint: 'https://axwzpqa4dwjl.compat.objectstorage.ap-hyderabad-1.oraclecloud.com/',
  endpoint: s3Url,
  forcePathStyle: true, // Required for Oracle Cloud
  credentials: {
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey,
  },
})
export default s3Client;

export const imageUploadS3 = async(body: Buffer<ArrayBufferLike>, type: string, key:string) => {
  // const key = `${category}/${Date.now()}`
  const command = new PutObjectCommand({
    Bucket: s3BucketName,
    Key: key,
    Body: body,
    ContentType: type,
  })
  const resp = await s3Client.send(command)
  
  const imageUrl = `${s3Url}${key}`
  return imageUrl;
}


export async function deleteImageUtil(...keys:string[]):Promise<boolean>;

export async function deleteImageUtil(bucket:string = s3BucketName, ...keys:string[]) {
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
    }
    
    const deleteCommand = new DeleteObjectsCommand(deleteParams)
    await s3Client.send(deleteCommand)
    return true
  }
  catch (error) {
    console.error("Error deleting image:", error)
    throw new Error("Failed to delete image")
    return false;
  }
}


/**
 * Generate a signed URL from an S3 URL
 * @param s3Url The full S3 URL (e.g., https://bucket-name.s3.region.amazonaws.com/path/to/object)
 * @param expiresIn Expiration time in seconds (default: 259200 seconds = 3 days)
 * @returns A pre-signed URL that provides temporary access to the object
 */
export async function generateSignedUrlFromS3Url(s3Url: string|null, expiresIn: number = 259200): Promise<string> {
  if (!s3Url) {
    return '';
  }
  
  try {
    // Check if we have a cached signed URL
    const cachedUrl = signedUrlCache.get(s3Url);
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
    const command = new GetObjectCommand({
      Bucket: s3BucketName,
      Key: path,
    });
    
    // Generate the signed URL
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    
    // Cache the signed URL with TTL matching the expiration time (convert seconds to milliseconds)
    signedUrlCache.set(s3Url, signedUrl, (expiresIn * 1000) - 60000); // Subtract 1 minute to ensure it doesn't expire before use
    
    return signedUrl;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error("Failed to generate signed URL");
  }
}

/**
 * Get the original S3 URL from a signed URL
 * @param signedUrl The signed URL 
 * @returns The original S3 URL if found in cache, otherwise null
 */
export function getOriginalUrlFromSignedUrl(signedUrl: string|null): string|null {
  if (!signedUrl) {
    return null;
  }
  
  // Try to find the original URL in our cache
  const originalUrl = signedUrlCache.getOriginalUrl(signedUrl);
  
  return originalUrl || null;
}

/**
 * Generate signed URLs for multiple S3 URLs
 * @param s3Urls Array of S3 URLs or null values
 * @param expiresIn Expiration time in seconds (default: 259200 seconds = 3 days)
 * @returns Array of signed URLs (empty strings for null/invalid inputs)
 */
export async function generateSignedUrlsFromS3Urls(s3Urls: (string|null)[], expiresIn: number = 259200): Promise<string[]> {
  if (!s3Urls || !s3Urls.length) {
    return [];
  }

  try {
    // Process URLs in parallel for better performance
    const signedUrls = await Promise.all(
      s3Urls.map(url => generateSignedUrlFromS3Url(url, expiresIn).catch(() => ''))
    );
    
    return signedUrls;
  } catch (error) {
    console.error("Error generating multiple signed URLs:", error);
    // Return an array of empty strings with the same length as input
    return s3Urls.map(() => '');
  }
}