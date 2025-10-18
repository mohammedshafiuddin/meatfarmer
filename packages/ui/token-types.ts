// Adding the types for hospital today's tokens and doctor today's tokens
export interface DoctorTokenSummary {
  id: number;
  name: string;
  specializations?: string[];
  totalTokens: number;
  completedTokens: number;
  inProgressTokens: number;
  upcomingTokens: number;
  currentTokenNumber?: number | null;
  tokens?: DoctorTodayToken[]; // Added individual tokens
}

export interface HospitalTodaysTokensResponse {
  message: string;
  hospitalId: number;
  hospitalName: string;
  date: string;
  doctors: DoctorTokenSummary[];
}

export interface DoctorTodayToken {
  id: number;
  queueNumber: number;
  patientId: number | null;
  patientName: string;
  patientMobile?: string;
  description: string | null;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED'; // Made optional
  // status: string; // 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED'; // Made optional
  consultationNotes?: string | null;
}

export interface DoctorTodaysTokensResponse {
  message: string;
  doctorId: number;
  doctorName: string;
  date: string;
  currentTokenNumber?: number | null;
  totalTokens: number;
  completedTokens: number;
  tokens: DoctorTodayToken[];
}
