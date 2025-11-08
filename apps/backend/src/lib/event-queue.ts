import redisClient from './redis-client';

export async function enqueue(queueName: string, eventData: any): Promise<boolean> {
  try {
    const jsonData = JSON.stringify(eventData);
    const result = await redisClient.lPush(queueName, jsonData);
    return result > 0;
  } catch (error) {
    console.error('Event enqueue error:', error);
    return false;
  }
}