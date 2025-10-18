import { pgTable, integer, varchar, date, unique, boolean, text, timestamp, numeric, json, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const mobileNumbersTable = pgTable('mobile_numbers', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	mobile: varchar({length: 255}).notNull(),
	password: varchar({length: 255})
})

export const mobileNumbersTableRelations = relations(mobileNumbersTable, ({ many }) => ({
	users: many(usersTable),
}));

export const usersTable = pgTable(
	"users",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		name: varchar({ length: 255 }).notNull(),
		username: varchar({ length: 255 }),  // Optional, will be null for regular users
		email: varchar({ length: 255 }),
		mobileId: integer("mobile_id").references(() => mobileNumbersTable.id),
		joinDate: date("join_date").notNull().default("now()"),
		address: varchar({ length: 500 }),
		profilePicUrl: varchar("profile_pic_url", { length: 255 }),
	},
	(t) => ({
		unq_email: unique("unique_email").on(t.email),
		unq_username: unique("unique_username").on(t.username),
	})
);

export const roleInfoTable = pgTable(
	"role_info",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		name: varchar({ length: 255 }).notNull(),
		description: varchar({ length: 500 }),
		displayName: varchar("display_name", { length: 255 }).notNull(),
	}
);

export const userRolesTable = pgTable(
	"user_roles",
	{
		userId: integer("user_id").notNull().references(() => usersTable.id),
		roleId: integer("role_id").notNull().references(() => roleInfoTable.id),
		addDate: date("add_date").notNull().default("now()"),
	},
	(t) => ({
		pk: unique("user_role_pk").on(t.userId, t.roleId),
	})
);

// Add relations for roleInfoTable
export const roleInfoTableRelations = relations(roleInfoTable, ({ many }) => ({
	userRoles: many(userRolesTable)
}));

// Add relations for userRolesTable
export const userRolesTableRelations = relations(userRolesTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [userRolesTable.userId],
		references: [usersTable.id]
	}),
	role: one(roleInfoTable, {
		fields: [userRolesTable.roleId],
		references: [roleInfoTable.id]
	})
}));

export const usersTableRelations = relations(usersTable, ({ many, one }) => ({
	roles: many(userRolesTable),
	doctorSecretaries: many(doctorSecretariesTable, {
		relationName: "doctor",
	}),
	secretaryForDoctors: many(doctorSecretariesTable, {
		relationName: "secretary",
	}),
	tokens: many(tokenInfoTable, {
		relationName: "userTokens",
	}),
	doctorTokens: many(tokenInfoTable, {
		relationName: "doctorTokens",
	}),
	userInfo: one(userInfoTable),
	doctorSpecializations: many(doctorSpecializationsTable),
	doctorAvailability: many(doctorAvailabilityTable),
    mobileNumber: one(mobileNumbersTable, {
        fields: [usersTable.mobileId],
        references: [mobileNumbersTable.id],
    }),
}));


export const hospitalTable = pgTable(
	"hospital",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		name: varchar({ length: 255 }).notNull(),
		address: varchar({ length: 500 }).notNull(),
		description: varchar({ length: 1000 }),
		hospitalImages: varchar('hospital_images', { length: 2000 }), // Comma-separated image URLs
	}
);

export const specializationsTable = pgTable(
	"specializations",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		name: varchar({ length: 255 }).notNull().unique(),
		description: varchar({ length: 1000 }),
	}
);

export const hospitalSpecializationsTable = pgTable(
	"hospital_specializations",
	{
		hospitalId: integer("hospital_id").notNull().references(() => hospitalTable.id),
		specializationId: integer("specialization_id").notNull().references(() => specializationsTable.id),
	},
	(t) => ({
		pk: unique("hospital_specialization_pk").on(t.hospitalId, t.specializationId),
	})
);

export const hospitalTableRelations = relations(hospitalTable, ({ many }) => ({
	specializations: many(hospitalSpecializationsTable),
	employees: many(hospitalEmployeesTable),
}));

export const hospitalEmployeesTable = pgTable(
	"hospital_employees",
	{
		hospitalId: integer("hospital_id").notNull().references(() => hospitalTable.id),
		userId: integer("user_id").notNull().references(() => usersTable.id),
		designation: varchar({ length: 255 }).notNull(),
	},
	(t) => ({
		pk: unique("hospital_employee_pk").on(t.hospitalId, t.userId),
	})
);

export const doctorInfoTable = pgTable(
	"doctor_info",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		userId: integer("user_id").notNull().references(() => usersTable.id).unique(),
		qualifications: varchar({ length: 1000 }),
		dailyTokenCount: integer("daily_token_count").notNull().default(20),
		consultationFee: numeric("consultation_fee", { precision: 10, scale: 2 }).notNull().default("0"),
		description: varchar({length: 1000}),
		yearsOfExperience: numeric("years_of_experience")
	}
);

export const doctorSpecializationsTable = pgTable(
	"doctor_specializations",
	{
		doctorId: integer("doctor_id").notNull().references(() => usersTable.id),
		specializationId: integer("specialization_id").notNull().references(() => specializationsTable.id),
	},
	(t) => ({
		pk: unique("doctor_specialization_pk").on(t.doctorId, t.specializationId),
	})
);

export const doctorSpecializationsTableRelations = relations(doctorSpecializationsTable, ({ one }) => ({
	doctor: one(usersTable, {
		fields: [doctorSpecializationsTable.doctorId],
		references: [usersTable.id]
	}),
	specialization: one(specializationsTable, {
		fields: [doctorSpecializationsTable.specializationId],
		references: [specializationsTable.id]
	})
}));

export const doctorInfoTableRelations = relations(doctorInfoTable, ({ one, many }) => ({
	user: one(usersTable, {
		fields: [doctorInfoTable.userId],
		references: [usersTable.id],
	}),
	// specializations now reference usersTable directly, not doctorInfoTable
	// availability now references usersTable directly, not doctorInfoTable
	// tokens now reference usersTable directly, not doctorInfoTable
	// counters now reference usersTable directly, not doctorInfoTable
}));

export const doctorSecretariesTable = pgTable(
	"doctor_secretaries",
	{
		doctorId: integer("doctor_id").notNull().references(() => usersTable.id),
		secretaryId: integer("secretary_id").notNull().references(() => usersTable.id),
	},
	(t) => ({
		pk: unique("doctor_secretary_pk").on(t.doctorId, t.secretaryId),
	})
);

export const doctorSecretariesRelations = relations(doctorSecretariesTable, ({ one }) => ({
	doctor: one(usersTable, {
		fields: [doctorSecretariesTable.doctorId],
		references: [usersTable.id],
	}),
	secretary: one(usersTable, {
		fields: [doctorSecretariesTable.secretaryId],
		references: [usersTable.id],
	}),
}));

export const doctorAvailabilityTable = pgTable(
	"doctor_availability",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		doctorId: integer("doctor_id").notNull().references(() => usersTable.id),
		date: date("date").notNull(),
		totalTokenCount: integer("total_token_count").notNull().default(0),
		filledTokenCount: integer("filled_token_count").notNull().default(0),
		consultationsDone: integer("consultations_done").notNull().default(0),
		isStopped: boolean("is_stopped").notNull().default(false),
	isPaused: boolean("is_paused").notNull().default(false),
	isLeave: boolean("is_leave").notNull().default(false),
	pauseReason: text("pause_reason"),
	},
	(t) => ({
		unq_doctor_date: unique("unique_doctor_date").on(t.doctorId, t.date),
	})
);

export const doctorAvailabilityRelations = relations(doctorAvailabilityTable, ({ one }) => ({
	doctor: one(usersTable, {
		fields: [doctorAvailabilityTable.doctorId],
		references: [usersTable.id],
	}),
}));

export const tokenInfoTable = pgTable(
	"token_info",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		doctorId: integer("doctor_id").notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
		userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
		tokenDate: date("token_date").notNull(),
		queueNum: integer("queue_num").notNull(),
		paymentId: integer("payment_id").references(() => paymentInfoTable.id).notNull(),
		description: varchar({ length: 1000 }),
		status: varchar("status", { length: 20 }).default("UPCOMING"), // New status field
		consultationNotes: varchar("consultation_notes", { length: 1000 }), // New consultation notes field
		doctorNotes: varchar("doctor_notes", {length: 1000}),
		imageUrls: varchar("image_urls", {length: 512}),
		createdAt: date("created_at").notNull().default("now()"),
	},
	(t) => ({
		unq_doctor_date_queue: unique("unique_doctor_date_queue").on(
			t.doctorId, 
			t.tokenDate, 
			t.queueNum
		),
	})
);

export const tokenInfoRelations = relations(tokenInfoTable, ({ one }) => ({
	doctor: one(usersTable, {
		fields: [tokenInfoTable.doctorId],
		references: [usersTable.id],
	}),
	user: one(usersTable, {
		fields: [tokenInfoTable.userId],
		references: [usersTable.id],
	}),
	payment: one(paymentInfoTable, {
		fields: [tokenInfoTable.paymentId],
		references: [paymentInfoTable.id],
	}),
}));

export const genderEnum = pgEnum('gender', ['Male', 'Female', 'Other']);

export const userInfoTable = pgTable(
	"user_info",
	{
		userId: integer("user_id").notNull().references(() => usersTable.id).primaryKey(),
		password: varchar("password", { length: 255 }),
		isSuspended: boolean("is_suspended").notNull().default(false),
		activeTokenVersion: integer("active_token_version").notNull().default(1),
		age: integer("age"),
		gender: genderEnum("gender"),
	}
);

export const userInfoRelations = relations(userInfoTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [userInfoTable.userId],
		references: [usersTable.id],
	}),
}));


export const paymentInfoTable = pgTable(
	"payment_info",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		status: varchar({ length: 50 }).notNull(),
		gateway: varchar({ length: 50 }).notNull(),
		orderId: varchar('order_id',{ length: 500 }),
		token: varchar({ length: 500 }),
		merchantOrderId: varchar('merchant_order_id', { length: 255 }).notNull().unique(),
		payload: json("payload"),
	}
);

export const paymentInfoRelations = relations(paymentInfoTable, ({ one }) => ({}));

export const offlineTokensTable = pgTable(
	"offline_tokens",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		doctorId: integer("doctor_id").notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
		tokenNum: integer("token_num").notNull(),
		description: varchar({ length: 1000 }),
		patientName: varchar('patient_name',{ length: 255 }).notNull(),
		mobileNumber: varchar('patient_mobile',{ length: 255 }).notNull(),
		date: date("date").notNull(),
		createdAt: date("created_at").notNull().default("now()"),
	},
	(t) => ({
		unq_doctor_date_token_num: unique("unique_doctor_date_token_num").on(
			t.doctorId,
			t.date,
			t.tokenNum
		),
	})
);

export const offlineTokensRelations = relations(offlineTokensTable, ({ one }) => ({
	doctor: one(usersTable, {
		fields: [offlineTokensTable.doctorId],
		references: [usersTable.id],
	}),
}));

export const notifCredsTable = pgTable("notif_creds", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  pushToken: varchar("push_token", { length: 255 }).notNull(),
  addedOn: timestamp("added_on", {withTimezone: true}).notNull().defaultNow(),
})

export const notifCredsTableRelations = relations(notifCredsTable, ({ one }) => ({
  userId: one(usersTable, { fields: [notifCredsTable.userId], references: [usersTable.id] }),
}))

export const notificationTable = pgTable("notifications", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  body: varchar("body", { length: 512 }).notNull(),
  imageUrl: varchar("image_url", { length: 255 }),
  redirectUrl: varchar("redirect_url", { length: 255 }),
  addedOn: timestamp("added_on", {withTimezone:true}).notNull().defaultNow(),
  tokenId: integer("token_id").references(() => tokenInfoTable.id),
  payload: jsonb("payload"),
})
export const notificationTableRelations = relations(notificationTable, ({ one }) => ({
  user: one(usersTable, { fields: [notificationTable.userId], references: [usersTable.id] }), 
  tokenId: one(tokenInfoTable, { fields: [notificationTable.id], references: [tokenInfoTable.id]}),
}))
