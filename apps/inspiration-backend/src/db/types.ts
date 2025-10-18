import type { InferSelectModel } from "drizzle-orm"
import type { 
  usersTable, 
  roleInfoTable, 
  userRolesTable,
  hospitalTable,
  specializationsTable,
  hospitalSpecializationsTable,
  hospitalEmployeesTable,
  doctorInfoTable,
  doctorSpecializationsTable,
  doctorSecretariesTable,
  doctorAvailabilityTable,
  tokenInfoTable
} from "./schema.js"

// Basic types
export type User = InferSelectModel<typeof usersTable>
export type Role = InferSelectModel<typeof roleInfoTable>
export type UserRole = InferSelectModel<typeof userRolesTable>
export type Hospital = InferSelectModel<typeof hospitalTable>
export type Specialization = InferSelectModel<typeof specializationsTable>
export type HospitalSpecialization = InferSelectModel<typeof hospitalSpecializationsTable>
export type HospitalEmployee = InferSelectModel<typeof hospitalEmployeesTable>
export type DoctorInfo = InferSelectModel<typeof doctorInfoTable>
export type DoctorSpecialization = InferSelectModel<typeof doctorSpecializationsTable>
export type DoctorSecretary = InferSelectModel<typeof doctorSecretariesTable>
export type DoctorAvailability = InferSelectModel<typeof doctorAvailabilityTable>
export type TokenInfo = InferSelectModel<typeof tokenInfoTable>

// Combined types with relations
export type UserWithRoles = User & {
  roles: UserRole[]
}

export type DoctorWithInfo = User & {
  doctorInfo: DoctorInfo
}

export type DoctorWithSpecializations = DoctorInfo & {
  specializations: (DoctorSpecialization & {
    specialization: Specialization
  })[]
}

export type DoctorWithAvailability = DoctorInfo & {
  availability: DoctorAvailability[]
}

export type DoctorWithSecretaries = User & {
  doctorSecretaries: (DoctorSecretary & {
    secretary: User
  })[]
}

export type SecretaryWithDoctors = User & {
  secretaryForDoctors: (DoctorSecretary & {
    doctor: User
  })[]
}

export type TokenWithDetails = TokenInfo & {
  doctor: DoctorInfo & {
    user: User
  },
  user: User
}

export type HospitalWithSpecializations = Hospital & {
  specializations: (HospitalSpecialization & {
    specialization: Specialization
  })[]
}

export type HospitalWithEmployees = Hospital & {
  employees: (HospitalEmployee & {
    user: User
  })[]
}

export type FullDoctorProfile = DoctorInfo & {
  user: User,
  specializations: (DoctorSpecialization & {
    specialization: Specialization
  })[],
  availability: DoctorAvailability[]
}

export type DoctorDailySchedule = DoctorAvailability & {
  doctor: DoctorInfo & {
    user: User
  },
  tokens: TokenInfo[]
}
