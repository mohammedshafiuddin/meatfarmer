// import { StorageService } from '@/lib/StorageService';
import {StorageService} from 'common-ui';

export const AUTH_TOKEN_KEY = 'authToken';
export const ROLES_KEY = 'user_roles';
export const USER_ID_KEY = 'userId';

export async function saveUserId(userId:string) {
  await StorageService.setItem(USER_ID_KEY, userId);
}

export async function getUserId() {
  return await StorageService.getItem(USER_ID_KEY);
}

export async function saveAuthToken(token: string) {
  await StorageService.setItem(AUTH_TOKEN_KEY, token);
}

export async function getAuthToken() {
  return await StorageService.getItem(AUTH_TOKEN_KEY);
}

export async function deleteAuthToken() {
  await StorageService.removeItem(AUTH_TOKEN_KEY);
}

export async function saveRoles(roles: string[]) {
  await StorageService.setItem(ROLES_KEY, JSON.stringify(roles));
}

export async function getRoles(): Promise<string[] | null> {
  const token = await getAuthToken();
  if (!token) {
    StorageService.removeItem(ROLES_KEY);
    return null;
  }
  const rolesStr = await StorageService.getItem(ROLES_KEY);
  if (!rolesStr) return null;
  try {
    return JSON.parse(rolesStr);
  } catch {
    return null;
  }
}

export async function deleteRoles() {
  await StorageService.removeItem(ROLES_KEY);
}
