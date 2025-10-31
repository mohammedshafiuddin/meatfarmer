import { createClient, RedisClientType } from 'redis';
import { redisUrl } from './env-exporter';

class RedisClient {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis Client Disconnected');
      this.isConnected = false;
    });
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
      } catch (error) {
        console.error('Failed to connect to Redis:', error);
        throw new Error('Redis connection failed');
      }
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      await this.ensureConnection();

      if (ttlSeconds) {
        const result = await this.client.setEx(key, ttlSeconds, value);
        return result === 'OK';
      } else {
        const result = await this.client.set(key, value);
        return result === 'OK';
      }
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      await this.ensureConnection();
      const value = await this.client.get(key);
      return value;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.ensureConnection();
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.ensureConnection();
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  disconnect(): void {
    if (this.isConnected) {
      this.client.disconnect();
    }
  }

  get isClientConnected(): boolean {
    return this.isConnected;
  }
}

const redisClient = new RedisClient();

export default redisClient;
export { RedisClient };