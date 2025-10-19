import {jwtDecode} from 'jwt-decode';
import { getAuthToken } from '../hooks/useJWT';

export async function getCurrentUserId(): Promise<number | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const decoded: any = jwtDecode(token);
    // Adjust this if your JWT uses a different field for user id
    return decoded.id || decoded.userId || null;
  } catch {
    return null;
  }
}
