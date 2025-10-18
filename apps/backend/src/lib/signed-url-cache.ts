import fs from 'fs';
import path from 'path';

const CACHE_FILE_PATH = path.join('.', 'assets');

// Interface for cache entries with TTL
interface CacheEntry {
  value: string;
  expiresAt: number; // Timestamp when this entry expires
}

class SignedURLCache {
  private originalToSignedCache: Map<string, CacheEntry>;
  private signedToOriginalCache: Map<string, CacheEntry>;

  constructor() {
    this.originalToSignedCache = new Map();
    this.signedToOriginalCache = new Map();
    
    // Create cache directory if it doesn't exist
    const cacheDir = path.dirname(CACHE_FILE_PATH);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
  }

  /**
   * Get a signed URL from the cache using an original URL as the key
   */
  get(originalUrl: string): string | undefined {
    const entry = this.originalToSignedCache.get(originalUrl);
    
    // If no entry or entry has expired, return undefined
    if (!entry || Date.now() > entry.expiresAt) {
      if (entry) {
        // Remove expired entry
        this.originalToSignedCache.delete(originalUrl);
        // Also remove from reverse mapping if it exists
        this.signedToOriginalCache.delete(entry.value);
      }
      return undefined;
    }
    
    return entry.value;
  }

  /**
   * Get the original URL from the cache using a signed URL as the key
   */
  getOriginalUrl(signedUrl: string): string | undefined {
    const entry = this.signedToOriginalCache.get(signedUrl);
    
    // If no entry or entry has expired, return undefined
    if (!entry || Date.now() > entry.expiresAt) {
      if (entry) {
        // Remove expired entry
        this.signedToOriginalCache.delete(signedUrl);
        // Also remove from primary mapping if it exists
        this.originalToSignedCache.delete(entry.value);
      }
      return undefined;
    }
    
    return entry.value;
  }

  /**
   * Set a value in the cache with a TTL (Time To Live)
   * @param originalUrl The original S3 URL
   * @param signedUrl The signed URL
   * @param ttlMs Time to live in milliseconds (default: 3 days)
   */
  set(originalUrl: string, signedUrl: string, ttlMs: number = 259200000): void {
    const expiresAt = Date.now() + ttlMs;
    
    const entry: CacheEntry = {
      value: signedUrl,
      expiresAt
    };
    
    const reverseEntry: CacheEntry = {
      value: originalUrl,
      expiresAt
    };
    
    this.originalToSignedCache.set(originalUrl, entry);
    this.signedToOriginalCache.set(signedUrl, reverseEntry);
  }

  has(originalUrl: string): boolean {
    const entry = this.originalToSignedCache.get(originalUrl);
    
    // Entry exists and hasn't expired
    return !!entry && Date.now() <= entry.expiresAt;
  }

  hasSignedUrl(signedUrl: string): boolean {
    const entry = this.signedToOriginalCache.get(signedUrl);
    
    // Entry exists and hasn't expired
    return !!entry && Date.now() <= entry.expiresAt;
  }

  clear(): void {
    this.originalToSignedCache.clear();
    this.signedToOriginalCache.clear();
    this.saveToDisk();
  }
  
  /**
   * Remove all expired entries from the cache
   * @returns The number of expired entries that were removed
   */
  clearExpired(): number {
    const now = Date.now();
    let removedCount = 0;
    
    // Clear expired entries from original to signed cache
    for (const [originalUrl, entry] of this.originalToSignedCache.entries()) {
      if (now > entry.expiresAt) {
        this.originalToSignedCache.delete(originalUrl);
        removedCount++;
      }
    }
    
    // Clear expired entries from signed to original cache
    for (const [signedUrl, entry] of this.signedToOriginalCache.entries()) {
      if (now > entry.expiresAt) {
        this.signedToOriginalCache.delete(signedUrl);
        // No need to increment removedCount as we've already counted these in the first loop
      }
    }
    
    if (removedCount > 0) {
      console.log(`SignedURLCache: Cleared ${removedCount} expired entries`);
    }
    
    return removedCount;
  }
  
  /**
   * Save the cache to disk
   */
  saveToDisk(): void {
    try {
      // Remove expired entries before saving
      const removedCount = this.clearExpired();
      
      // Convert Maps to serializable objects
      const serializedOriginalToSigned: Record<string, { value: string; expiresAt: number }> = {};
      const serializedSignedToOriginal: Record<string, { value: string; expiresAt: number }> = {};
      
      for (const [originalUrl, entry] of this.originalToSignedCache.entries()) {
        serializedOriginalToSigned[originalUrl] = {
          value: entry.value,
          expiresAt: entry.expiresAt
        };
      }
      
      for (const [signedUrl, entry] of this.signedToOriginalCache.entries()) {
        serializedSignedToOriginal[signedUrl] = {
          value: entry.value,
          expiresAt: entry.expiresAt
        };
      }
      
      const serializedCache = {
        originalToSigned: serializedOriginalToSigned,
        signedToOriginal: serializedSignedToOriginal
      };
      
      // Write to file
      fs.writeFileSync(
        CACHE_FILE_PATH, 
        JSON.stringify(serializedCache),
        'utf8'
      );
      
      console.log(`SignedURLCache: Saved ${this.originalToSignedCache.size} entries to disk`);
    } catch (error) {
      console.error('Error saving SignedURLCache to disk:', error);
    }
  }
  
  /**
   * Load the cache from disk
   */
  loadFromDisk(): void {
    try {
      if (fs.existsSync(CACHE_FILE_PATH)) {
        // Read from file
        const data = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
        
        // Parse the data
        const parsedData = JSON.parse(data) as {
          originalToSigned: Record<string, { value: string; expiresAt: number }>,
          signedToOriginal: Record<string, { value: string; expiresAt: number }>
        };
        
        // Only load entries that haven't expired yet
        const now = Date.now();
        let loadedCount = 0;
        let expiredCount = 0;
        
        // Load original to signed mappings
        if (parsedData.originalToSigned) {
          for (const [originalUrl, entry] of Object.entries(parsedData.originalToSigned)) {
            if (now <= entry.expiresAt) {
              this.originalToSignedCache.set(originalUrl, entry);
              loadedCount++;
            } else {
              expiredCount++;
            }
          }
        }
        
        // Load signed to original mappings
        if (parsedData.signedToOriginal) {
          for (const [signedUrl, entry] of Object.entries(parsedData.signedToOriginal)) {
            if (now <= entry.expiresAt) {
              this.signedToOriginalCache.set(signedUrl, entry);
              // Don't increment loadedCount as these are pairs of what we already counted
            } else {
              // Don't increment expiredCount as these are pairs of what we already counted
            }
          }
        }
        
        console.log(`SignedURLCache: Loaded ${loadedCount} valid entries from disk (skipped ${expiredCount} expired entries)`);
      } else {
        console.log('SignedURLCache: No cache file found, starting with empty cache');
      }
    } catch (error) {
      console.error('Error loading SignedURLCache from disk:', error);
      // Start with empty caches if loading fails
      this.originalToSignedCache = new Map();
      this.signedToOriginalCache = new Map();
    }
  }
}

// Create a singleton instance to be used throughout the application
const signedUrlCache = new SignedURLCache();

process.on('SIGINT', () => {
  console.log('SignedURLCache: Saving cache before shutdown...');
  signedUrlCache.saveToDisk();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('SignedURLCache: Saving cache before shutdown...');
  signedUrlCache.saveToDisk();
  process.exit(0);
});

export default signedUrlCache;