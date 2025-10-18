/**
 * Constants for role names to maintain consistency between frontend and backend
 */
export const ROLE_NAMES = {
  ADMIN: 'admin',
  GENERAL_USER: 'gen_user',
  HOSPITAL_ADMIN: 'hospital_admin',
  DOCTOR: 'doctor',
  HOSPITAL_ASSISTANT: 'hospital_assistant',
  DOCTOR_SECRETARY: 'doctor_secretary'
};

/**
 * Constants for display names of roles for UI presentation
 */
export const ROLE_DISPLAY_NAMES = {
  [ROLE_NAMES.ADMIN]: 'Administrator',
  [ROLE_NAMES.GENERAL_USER]: 'General User',
  [ROLE_NAMES.HOSPITAL_ADMIN]: 'Hospital Admin',
  [ROLE_NAMES.DOCTOR]: 'Doctor',
  [ROLE_NAMES.HOSPITAL_ASSISTANT]: 'Hospital Assistant',
  [ROLE_NAMES.DOCTOR_SECRETARY]: 'Doctor Secretary'
};

/**
 * Role options for dropdowns in forms
 */
export const ROLE_OPTIONS = [
  { label: ROLE_DISPLAY_NAMES[ROLE_NAMES.HOSPITAL_ADMIN], value: ROLE_NAMES.HOSPITAL_ADMIN },
  { label: ROLE_DISPLAY_NAMES[ROLE_NAMES.DOCTOR], value: ROLE_NAMES.DOCTOR },
  { label: ROLE_DISPLAY_NAMES[ROLE_NAMES.HOSPITAL_ASSISTANT], value: ROLE_NAMES.HOSPITAL_ASSISTANT },
  { label: ROLE_DISPLAY_NAMES[ROLE_NAMES.DOCTOR_SECRETARY], value: ROLE_NAMES.DOCTOR_SECRETARY }
];

/**
 * Business role options (subset of roles that can be assigned to business users)
 */
export const BUSINESS_ROLE_OPTIONS = [
  { label: ROLE_DISPLAY_NAMES[ROLE_NAMES.HOSPITAL_ADMIN], value: ROLE_NAMES.HOSPITAL_ADMIN },
  { label: ROLE_DISPLAY_NAMES[ROLE_NAMES.DOCTOR], value: ROLE_NAMES.DOCTOR },
  { label: ROLE_DISPLAY_NAMES[ROLE_NAMES.HOSPITAL_ASSISTANT], value: ROLE_NAMES.HOSPITAL_ASSISTANT },
  { label: ROLE_DISPLAY_NAMES[ROLE_NAMES.DOCTOR_SECRETARY], value: ROLE_NAMES.DOCTOR_SECRETARY }
];

export const GENDERS = ['Male', 'Female']