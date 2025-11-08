import { eq } from "drizzle-orm";
import { db } from "../db/db_index";
import { deleteImageUtil, getOriginalUrlFromSignedUrl } from "./s3-client";
import { s3Url } from "./env-exporter";

function extractS3Key(url: string): string | null {
  try {
    // Check if this is a signed URL first and get the original if it is
    const originalUrl = getOriginalUrlFromSignedUrl(url) || url;
    
    // Find the index of '.com/' in the URL
    // const comIndex = originalUrl.indexOf(".com/");
    const baseUrlIndex = originalUrl.indexOf(s3Url);

    // If '.com/' is found, return everything after it
    if (baseUrlIndex !== -1) {
      return originalUrl.substring(baseUrlIndex + s3Url.length); // +5 to skip '.com/'
    }
  } catch (error) {
    console.error("Error extracting key from URL:", error);
  }
  
  // Return null if the pattern isn't found or there was an error
  return null;
}


export async function deleteS3Image(imageUrl: string) {
  try {
    // First check if this is a signed URL and get the original if it is
    const originalUrl = getOriginalUrlFromSignedUrl(imageUrl) || imageUrl;
    
    const key = extractS3Key(originalUrl || "");
    

    if (!key) {
      throw new Error("Invalid image URL format");
    }
    const deleteS3 = await deleteImageUtil(key);
    if (!deleteS3) {
      throw new Error("Failed to delete image from S3");
    }
  } catch (error) {
    console.error("Error deleting image from S3:", error);
  }
}
