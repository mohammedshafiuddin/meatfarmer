export type Person = {
    name: string;
    age: number;
    email: string;
}


export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  profilePicUrl?: string;
  address?: string;
  joinDate?: Date;
  specializations: DoctorSpecialization[] | null;
  qualifications?: string;
  hospital?: string;
  hospitalId?: number;
  consultationFee?: string;
}

export interface Hospital {
  id: number;
  name: string;
  description?: string;
  address: string;
  adminId?: number;
  adminName?: string;
  hospitalImages?: string[]
}

export interface DoctorSpecialization {
  id: number;
  name: string | null;
  description: string | null;
}

export interface DoctorInfo {
  id: number;
  qualifications: string | null;
  dailyTokenCount: number;
  consultationFee: number | string;
}

export interface Doctor {
  id: number;
  name: string;
  username?: string | null;
  email?: string | null;
  mobile?: string;
  doctorInfo?: DoctorInfo;
  specializations?: DoctorSpecialization[] | null;
  qualifications: string | null;
}

export interface DoctorDetails {
  id: number;
  name: string;
  username?: string | null;
  email?: string | null;
  mobile?: string;
  profilePicUrl?: string | null;
  address?: string | null;
  joinDate?: string | null;
  role: string;
  roles: string[];
  doctorId: number;
  qualifications?: string | null;
  dailyTokenCount: number;
  consultationFee: number;
  hospital?: string;
  hospitalId?: number;
  description?: string | null;
  yearsOfExperience?: number | null;
  specializations: {
    id: number;
    name: string;
    description: string | null;
  }[];
  isConsultationsPaused: boolean;
  pauseReason: string | null;
}

// Define local DashboardDoctor type based on the API response structure
export interface DashboardDoctor {
  availableTokens: number;
  consultationFee: string;
  consultationsDone: number;
  currentConsultationNumber: number;
  id: number;
  isAvailable: boolean;
  name: string;
  profilePicUrl?: string | null;
  qualifications: string | null;
  tokensIssuedToday: number;
  totalTokenCount: number;
}

// Token types
export interface TokenDoctor {
  id: number;
  name: string;
  mobile: string;
  profilePicUrl: string | null;
}

export interface UpcomingToken {
  id: number;
  tokenDate: string;
  queueNumber: number;
  description: string | null;
  createdAt: string;
  doctor: TokenDoctor;
  currentConsultationNumber?: number; // Current consultation number for the doctor
}

export interface PastToken {
  id: number;
  tokenDate: string;
  queueNumber: number;
  description: string | null;
  createdAt: string;
  doctor: TokenDoctor;
  status?: 'COMPLETED' | 'MISSED' | 'CANCELLED';
  consultationNotes?: string | null;
}

export interface UpcomingAppointment {
  id: number;
  doctorName: string;
  doctorImageUrl?: string;
  date: string;
  hospital: string;
  queueNumber: number;
  status: string;
}

export interface MyTokensResponse {
  message: string;
  tokens: UpcomingToken[];
}

export interface PastTokensResponse {
  message: string;
  tokens: PastToken[];
}

export interface BookTokenPayload {
  doctorId: number;
  userId: number;
  tokenDate: string;
  description?: string;
}

export interface BookTokenResponse {
  message: string;
  token: {
    id: number;
    doctorId: number;
    userId: number;
    tokenDate: string;
    queueNumber: number;
    description: string | null;
    createdAt: string;
  };
}

// Doctor availability types
export interface DoctorAvailability {
  id: number;
  doctorId: number;
  date: string;
  totalTokenCount: number;
  filledTokenCount: number;
  consultationsDone: number;
  isStopped: boolean;
  availableTokens: number;
  isPaused: boolean;
  isLeave: boolean;
  pauseReason: string | null;
}

export interface DoctorAvailabilityWithDate {
  date: string;
  availability: DoctorAvailability | null;
}

export interface DoctorAvailabilityResponse {
  message: string;
  doctorId: number;
  availabilities: DoctorAvailabilityWithDate[];
}

export interface DoctorAvailabilityPayload {
  doctorId: number;
  date: string;
  tokenCount: number;
  isStopped?: boolean;
  filledTokenCount?: number;
  consultationsDone?: number;
}


export interface token_user {
  id: number;
  name: string;
  mobile: string;
  age: number;
  gender: string;
}

export interface ProductSummary {
  id: number;
  name: string;
  shortDescription?: string;
  price: number;
  unit: string;
  isOutOfStock: boolean;
  nextDeliveryDate: string | null;
  images: string[];
}

export interface GetSlotsProductIdsPayload {
  slotIds: number[];
}

export interface GetSlotsProductIdsResponse {
  [slotId: number]: number[];
}

export interface Order {
  orderId: string;
  readableId: string;
  customerName: string;
  address: string;
  totalAmount: number;
  items: {
    name: string;
    quantity: number;
    price: number;
    amount: number;
    unit: string;
  }[];
  deliveryTime: string;
  status: 'pending' | 'delivered' | 'cancelled';
  isPackaged: boolean;
  isDelivered: boolean;
  isCod: boolean;
  paymentMode: string;
  paymentStatus: string;
  slotId: number;
}

export interface Slot {
  id: number;
  deliveryTime: string;
  freezeTime: string;
  isActive: boolean;
  deliverySequence?: number[];
}

export interface Coupon {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  isActive: boolean;
  validFrom: string;
  validTill: string;
  usageLimit?: number;
  usedCount: number;
  createdAt: string;
}

export interface CreateCouponPayload {
  couponCode: string;
  discountType: 'percentage' | 'fixed';
  discountPercent?: number;
  flatDiscount?: number;
  minOrder?: number;
  maxValue?: number;
  validFrom: string;
  validTill: string;
  maxLimitForUser?: number;
  isApplyForAll: boolean;
  isUserBased: boolean;
  targetUser?: string;
  productIds?: number[];
}

// Patient History Types
export interface PatientHistoryToken {
  id: number;
  queueNum: number;
  tokenDate: string;
  doctorName: string;
  status: string;
  description: string;
  consultationNotes?: string;
}

export interface PatientHistory {
  id: number;
  name: string;
  mobile: string;
  age: number;
  gender: string;
  totalTokens: number;
  completedTokens: number;
  upcomingTokens: number;
  firstVisitDate: string;
  lastVisitDate: string;
  tokens: PatientHistoryToken[];
}

export interface GetHospitalPatientHistoryResponse {
  message: string;
  patients: PatientHistory[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface PatientHistoryFilters {
  patientIds?: string[];
  doctorIds?: string[];
  statuses?: string[];
  startDate?: string | null;
  endDate?: string | null;
}


// Export the types from token-types.ts
export * from './token-types';