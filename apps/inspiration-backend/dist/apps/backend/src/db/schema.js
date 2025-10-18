"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationTableRelations = exports.notificationTable = exports.notifCredsTableRelations = exports.notifCredsTable = exports.offlineTokensRelations = exports.offlineTokensTable = exports.paymentInfoRelations = exports.paymentInfoTable = exports.userInfoRelations = exports.userInfoTable = exports.genderEnum = exports.tokenInfoRelations = exports.tokenInfoTable = exports.doctorAvailabilityRelations = exports.doctorAvailabilityTable = exports.doctorSecretariesRelations = exports.doctorSecretariesTable = exports.doctorInfoTableRelations = exports.doctorSpecializationsTableRelations = exports.doctorSpecializationsTable = exports.doctorInfoTable = exports.hospitalEmployeesTable = exports.hospitalTableRelations = exports.hospitalSpecializationsTable = exports.specializationsTable = exports.hospitalTable = exports.usersTableRelations = exports.userRolesTableRelations = exports.roleInfoTableRelations = exports.userRolesTable = exports.roleInfoTable = exports.usersTable = exports.mobileNumbersTableRelations = exports.mobileNumbersTable = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.mobileNumbersTable = (0, pg_core_1.pgTable)('mobile_numbers', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    mobile: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    password: (0, pg_core_1.varchar)({ length: 255 })
});
exports.mobileNumbersTableRelations = (0, drizzle_orm_1.relations)(exports.mobileNumbersTable, ({ many }) => ({
    users: many(exports.usersTable),
}));
exports.usersTable = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    username: (0, pg_core_1.varchar)({ length: 255 }), // Optional, will be null for regular users
    email: (0, pg_core_1.varchar)({ length: 255 }),
    mobileId: (0, pg_core_1.integer)("mobile_id").references(() => exports.mobileNumbersTable.id),
    joinDate: (0, pg_core_1.date)("join_date").notNull().default("now()"),
    address: (0, pg_core_1.varchar)({ length: 500 }),
    profilePicUrl: (0, pg_core_1.varchar)("profile_pic_url", { length: 255 }),
}, (t) => ({
    unq_email: (0, pg_core_1.unique)("unique_email").on(t.email),
    unq_username: (0, pg_core_1.unique)("unique_username").on(t.username),
}));
exports.roleInfoTable = (0, pg_core_1.pgTable)("role_info", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    description: (0, pg_core_1.varchar)({ length: 500 }),
    displayName: (0, pg_core_1.varchar)("display_name", { length: 255 }).notNull(),
});
exports.userRolesTable = (0, pg_core_1.pgTable)("user_roles", {
    userId: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.usersTable.id),
    roleId: (0, pg_core_1.integer)("role_id").notNull().references(() => exports.roleInfoTable.id),
    addDate: (0, pg_core_1.date)("add_date").notNull().default("now()"),
}, (t) => ({
    pk: (0, pg_core_1.unique)("user_role_pk").on(t.userId, t.roleId),
}));
// Add relations for roleInfoTable
exports.roleInfoTableRelations = (0, drizzle_orm_1.relations)(exports.roleInfoTable, ({ many }) => ({
    userRoles: many(exports.userRolesTable)
}));
// Add relations for userRolesTable
exports.userRolesTableRelations = (0, drizzle_orm_1.relations)(exports.userRolesTable, ({ one }) => ({
    user: one(exports.usersTable, {
        fields: [exports.userRolesTable.userId],
        references: [exports.usersTable.id]
    }),
    role: one(exports.roleInfoTable, {
        fields: [exports.userRolesTable.roleId],
        references: [exports.roleInfoTable.id]
    })
}));
exports.usersTableRelations = (0, drizzle_orm_1.relations)(exports.usersTable, ({ many, one }) => ({
    roles: many(exports.userRolesTable),
    doctorSecretaries: many(exports.doctorSecretariesTable, {
        relationName: "doctor",
    }),
    secretaryForDoctors: many(exports.doctorSecretariesTable, {
        relationName: "secretary",
    }),
    tokens: many(exports.tokenInfoTable, {
        relationName: "userTokens",
    }),
    doctorTokens: many(exports.tokenInfoTable, {
        relationName: "doctorTokens",
    }),
    userInfo: one(exports.userInfoTable),
    doctorSpecializations: many(exports.doctorSpecializationsTable),
    doctorAvailability: many(exports.doctorAvailabilityTable),
    mobileNumber: one(exports.mobileNumbersTable, {
        fields: [exports.usersTable.mobileId],
        references: [exports.mobileNumbersTable.id],
    }),
}));
exports.hospitalTable = (0, pg_core_1.pgTable)("hospital", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    address: (0, pg_core_1.varchar)({ length: 500 }).notNull(),
    description: (0, pg_core_1.varchar)({ length: 1000 }),
    hospitalImages: (0, pg_core_1.varchar)('hospital_images', { length: 2000 }), // Comma-separated image URLs
});
exports.specializationsTable = (0, pg_core_1.pgTable)("specializations", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull().unique(),
    description: (0, pg_core_1.varchar)({ length: 1000 }),
});
exports.hospitalSpecializationsTable = (0, pg_core_1.pgTable)("hospital_specializations", {
    hospitalId: (0, pg_core_1.integer)("hospital_id").notNull().references(() => exports.hospitalTable.id),
    specializationId: (0, pg_core_1.integer)("specialization_id").notNull().references(() => exports.specializationsTable.id),
}, (t) => ({
    pk: (0, pg_core_1.unique)("hospital_specialization_pk").on(t.hospitalId, t.specializationId),
}));
exports.hospitalTableRelations = (0, drizzle_orm_1.relations)(exports.hospitalTable, ({ many }) => ({
    specializations: many(exports.hospitalSpecializationsTable),
    employees: many(exports.hospitalEmployeesTable),
}));
exports.hospitalEmployeesTable = (0, pg_core_1.pgTable)("hospital_employees", {
    hospitalId: (0, pg_core_1.integer)("hospital_id").notNull().references(() => exports.hospitalTable.id),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.usersTable.id),
    designation: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
}, (t) => ({
    pk: (0, pg_core_1.unique)("hospital_employee_pk").on(t.hospitalId, t.userId),
}));
exports.doctorInfoTable = (0, pg_core_1.pgTable)("doctor_info", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.usersTable.id).unique(),
    qualifications: (0, pg_core_1.varchar)({ length: 1000 }),
    dailyTokenCount: (0, pg_core_1.integer)("daily_token_count").notNull().default(20),
    consultationFee: (0, pg_core_1.numeric)("consultation_fee", { precision: 10, scale: 2 }).notNull().default("0"),
    description: (0, pg_core_1.varchar)({ length: 1000 }),
    yearsOfExperience: (0, pg_core_1.numeric)("years_of_experience")
});
exports.doctorSpecializationsTable = (0, pg_core_1.pgTable)("doctor_specializations", {
    doctorId: (0, pg_core_1.integer)("doctor_id").notNull().references(() => exports.usersTable.id),
    specializationId: (0, pg_core_1.integer)("specialization_id").notNull().references(() => exports.specializationsTable.id),
}, (t) => ({
    pk: (0, pg_core_1.unique)("doctor_specialization_pk").on(t.doctorId, t.specializationId),
}));
exports.doctorSpecializationsTableRelations = (0, drizzle_orm_1.relations)(exports.doctorSpecializationsTable, ({ one }) => ({
    doctor: one(exports.usersTable, {
        fields: [exports.doctorSpecializationsTable.doctorId],
        references: [exports.usersTable.id]
    }),
    specialization: one(exports.specializationsTable, {
        fields: [exports.doctorSpecializationsTable.specializationId],
        references: [exports.specializationsTable.id]
    })
}));
exports.doctorInfoTableRelations = (0, drizzle_orm_1.relations)(exports.doctorInfoTable, ({ one, many }) => ({
    user: one(exports.usersTable, {
        fields: [exports.doctorInfoTable.userId],
        references: [exports.usersTable.id],
    }),
    // specializations now reference usersTable directly, not doctorInfoTable
    // availability now references usersTable directly, not doctorInfoTable
    // tokens now reference usersTable directly, not doctorInfoTable
    // counters now reference usersTable directly, not doctorInfoTable
}));
exports.doctorSecretariesTable = (0, pg_core_1.pgTable)("doctor_secretaries", {
    doctorId: (0, pg_core_1.integer)("doctor_id").notNull().references(() => exports.usersTable.id),
    secretaryId: (0, pg_core_1.integer)("secretary_id").notNull().references(() => exports.usersTable.id),
}, (t) => ({
    pk: (0, pg_core_1.unique)("doctor_secretary_pk").on(t.doctorId, t.secretaryId),
}));
exports.doctorSecretariesRelations = (0, drizzle_orm_1.relations)(exports.doctorSecretariesTable, ({ one }) => ({
    doctor: one(exports.usersTable, {
        fields: [exports.doctorSecretariesTable.doctorId],
        references: [exports.usersTable.id],
    }),
    secretary: one(exports.usersTable, {
        fields: [exports.doctorSecretariesTable.secretaryId],
        references: [exports.usersTable.id],
    }),
}));
exports.doctorAvailabilityTable = (0, pg_core_1.pgTable)("doctor_availability", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    doctorId: (0, pg_core_1.integer)("doctor_id").notNull().references(() => exports.usersTable.id),
    date: (0, pg_core_1.date)("date").notNull(),
    totalTokenCount: (0, pg_core_1.integer)("total_token_count").notNull().default(0),
    filledTokenCount: (0, pg_core_1.integer)("filled_token_count").notNull().default(0),
    consultationsDone: (0, pg_core_1.integer)("consultations_done").notNull().default(0),
    isStopped: (0, pg_core_1.boolean)("is_stopped").notNull().default(false),
    isPaused: (0, pg_core_1.boolean)("is_paused").notNull().default(false),
    isLeave: (0, pg_core_1.boolean)("is_leave").notNull().default(false),
    pauseReason: (0, pg_core_1.text)("pause_reason"),
}, (t) => ({
    unq_doctor_date: (0, pg_core_1.unique)("unique_doctor_date").on(t.doctorId, t.date),
}));
exports.doctorAvailabilityRelations = (0, drizzle_orm_1.relations)(exports.doctorAvailabilityTable, ({ one }) => ({
    doctor: one(exports.usersTable, {
        fields: [exports.doctorAvailabilityTable.doctorId],
        references: [exports.usersTable.id],
    }),
}));
exports.tokenInfoTable = (0, pg_core_1.pgTable)("token_info", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    doctorId: (0, pg_core_1.integer)("doctor_id").notNull().references(() => exports.usersTable.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.usersTable.id, { onDelete: 'cascade' }),
    tokenDate: (0, pg_core_1.date)("token_date").notNull(),
    queueNum: (0, pg_core_1.integer)("queue_num").notNull(),
    paymentId: (0, pg_core_1.integer)("payment_id").references(() => exports.paymentInfoTable.id).notNull(),
    description: (0, pg_core_1.varchar)({ length: 1000 }),
    status: (0, pg_core_1.varchar)("status", { length: 20 }).default("UPCOMING"), // New status field
    consultationNotes: (0, pg_core_1.varchar)("consultation_notes", { length: 1000 }), // New consultation notes field
    doctorNotes: (0, pg_core_1.varchar)("doctor_notes", { length: 1000 }),
    imageUrls: (0, pg_core_1.varchar)("image_urls", { length: 512 }),
    createdAt: (0, pg_core_1.date)("created_at").notNull().default("now()"),
}, (t) => ({
    unq_doctor_date_queue: (0, pg_core_1.unique)("unique_doctor_date_queue").on(t.doctorId, t.tokenDate, t.queueNum),
}));
exports.tokenInfoRelations = (0, drizzle_orm_1.relations)(exports.tokenInfoTable, ({ one }) => ({
    doctor: one(exports.usersTable, {
        fields: [exports.tokenInfoTable.doctorId],
        references: [exports.usersTable.id],
    }),
    user: one(exports.usersTable, {
        fields: [exports.tokenInfoTable.userId],
        references: [exports.usersTable.id],
    }),
    payment: one(exports.paymentInfoTable, {
        fields: [exports.tokenInfoTable.paymentId],
        references: [exports.paymentInfoTable.id],
    }),
}));
exports.genderEnum = (0, pg_core_1.pgEnum)('gender', ['Male', 'Female', 'Other']);
exports.userInfoTable = (0, pg_core_1.pgTable)("user_info", {
    userId: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.usersTable.id).primaryKey(),
    password: (0, pg_core_1.varchar)("password", { length: 255 }),
    isSuspended: (0, pg_core_1.boolean)("is_suspended").notNull().default(false),
    activeTokenVersion: (0, pg_core_1.integer)("active_token_version").notNull().default(1),
    age: (0, pg_core_1.integer)("age"),
    gender: (0, exports.genderEnum)("gender"),
});
exports.userInfoRelations = (0, drizzle_orm_1.relations)(exports.userInfoTable, ({ one }) => ({
    user: one(exports.usersTable, {
        fields: [exports.userInfoTable.userId],
        references: [exports.usersTable.id],
    }),
}));
exports.paymentInfoTable = (0, pg_core_1.pgTable)("payment_info", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    status: (0, pg_core_1.varchar)({ length: 50 }).notNull(),
    gateway: (0, pg_core_1.varchar)({ length: 50 }).notNull(),
    orderId: (0, pg_core_1.varchar)('order_id', { length: 500 }),
    token: (0, pg_core_1.varchar)({ length: 500 }),
    merchantOrderId: (0, pg_core_1.varchar)('merchant_order_id', { length: 255 }).notNull().unique(),
    payload: (0, pg_core_1.json)("payload"),
});
exports.paymentInfoRelations = (0, drizzle_orm_1.relations)(exports.paymentInfoTable, ({ one }) => ({}));
exports.offlineTokensTable = (0, pg_core_1.pgTable)("offline_tokens", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    doctorId: (0, pg_core_1.integer)("doctor_id").notNull().references(() => exports.usersTable.id, { onDelete: 'cascade' }),
    tokenNum: (0, pg_core_1.integer)("token_num").notNull(),
    description: (0, pg_core_1.varchar)({ length: 1000 }),
    patientName: (0, pg_core_1.varchar)('patient_name', { length: 255 }).notNull(),
    mobileNumber: (0, pg_core_1.varchar)('patient_mobile', { length: 255 }).notNull(),
    date: (0, pg_core_1.date)("date").notNull(),
    createdAt: (0, pg_core_1.date)("created_at").notNull().default("now()"),
}, (t) => ({
    unq_doctor_date_token_num: (0, pg_core_1.unique)("unique_doctor_date_token_num").on(t.doctorId, t.date, t.tokenNum),
}));
exports.offlineTokensRelations = (0, drizzle_orm_1.relations)(exports.offlineTokensTable, ({ one }) => ({
    doctor: one(exports.usersTable, {
        fields: [exports.offlineTokensTable.doctorId],
        references: [exports.usersTable.id],
    }),
}));
exports.notifCredsTable = (0, pg_core_1.pgTable)("notif_creds", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.usersTable.id, { onDelete: "cascade" }),
    pushToken: (0, pg_core_1.varchar)("push_token", { length: 255 }).notNull(),
    addedOn: (0, pg_core_1.timestamp)("added_on", { withTimezone: true }).notNull().defaultNow(),
});
exports.notifCredsTableRelations = (0, drizzle_orm_1.relations)(exports.notifCredsTable, ({ one }) => ({
    userId: one(exports.usersTable, { fields: [exports.notifCredsTable.userId], references: [exports.usersTable.id] }),
}));
exports.notificationTable = (0, pg_core_1.pgTable)("notifications", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.usersTable.id, { onDelete: "cascade" }),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    body: (0, pg_core_1.varchar)("body", { length: 512 }).notNull(),
    imageUrl: (0, pg_core_1.varchar)("image_url", { length: 255 }),
    redirectUrl: (0, pg_core_1.varchar)("redirect_url", { length: 255 }),
    addedOn: (0, pg_core_1.timestamp)("added_on", { withTimezone: true }).notNull().defaultNow(),
    tokenId: (0, pg_core_1.integer)("token_id").references(() => exports.tokenInfoTable.id),
    payload: (0, pg_core_1.jsonb)("payload"),
});
exports.notificationTableRelations = (0, drizzle_orm_1.relations)(exports.notificationTable, ({ one }) => ({
    user: one(exports.usersTable, { fields: [exports.notificationTable.userId], references: [exports.usersTable.id] }),
    tokenId: one(exports.tokenInfoTable, { fields: [exports.notificationTable.id], references: [exports.tokenInfoTable.id] }),
}));
