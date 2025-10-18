/**
 * This file contains constants that are used throughout the application
 * to avoid hardcoding strings in multiple places
 */

// User role and designation constants
export const DESIGNATIONS = {
  HOSPITAL_ADMIN: 'Hospital Admin',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  RECEPTIONIST: 'Receptionist',
  PHARMACIST: 'Pharmacist',
  LAB_TECHNICIAN: 'Lab Technician',
  OTHER: 'Other',
};

// Error message constants
export const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Unauthorized access',
  MISSING_FIELDS: 'Missing required fields',
  SERVER_ERROR: 'Internal server error',
  DUPLICATE_USER: 'User already exists',
};

// Success message constants
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
};

// API endpoint constants
export const API_ENDPOINTS = {
  USERS: '/users',
  HOSPITALS: '/hospitals',
  DOCTORS: '/doctors',
  TOKENS: '/tokens',
};

export const S3KeyPrefixes = {
  USERS_PROFILE_PIC: 'users_profile_pic',
  HOSPITAL_PIC: 'hospital_image',
}
