CREATE TABLE "doctor_availability" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "doctor_availability_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"doctor_id" integer NOT NULL,
	"date" date NOT NULL,
	"total_token_count" integer DEFAULT 0 NOT NULL,
	"filled_token_count" integer DEFAULT 0 NOT NULL,
	"is_stopped" boolean DEFAULT false NOT NULL,
	CONSTRAINT "unique_doctor_date" UNIQUE("doctor_id","date")
);
--> statement-breakpoint
CREATE TABLE "doctor_info" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "doctor_info_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"qualifications" varchar(1000),
	"daily_token_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "doctor_info_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "doctor_secretaries" (
	"doctor_id" integer NOT NULL,
	"secretary_id" integer NOT NULL,
	CONSTRAINT "doctor_secretary_pk" UNIQUE("doctor_id","secretary_id")
);
--> statement-breakpoint
CREATE TABLE "doctor_specializations" (
	"doctor_id" integer NOT NULL,
	"specialization_id" integer NOT NULL,
	CONSTRAINT "doctor_specialization_pk" UNIQUE("doctor_id","specialization_id")
);
--> statement-breakpoint
CREATE TABLE "hospital_employees" (
	"hospital_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"designation" varchar(255) NOT NULL,
	CONSTRAINT "hospital_employee_pk" UNIQUE("hospital_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "hospital_specializations" (
	"hospital_id" integer NOT NULL,
	"specialization_id" integer NOT NULL,
	CONSTRAINT "hospital_specialization_pk" UNIQUE("hospital_id","specialization_id")
);
--> statement-breakpoint
CREATE TABLE "hospital" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hospital_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"address" varchar(500) NOT NULL,
	"description" varchar(1000)
);
--> statement-breakpoint
CREATE TABLE "role_info" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "role_info_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"displayName" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "running_counter" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "running_counter_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"date" date NOT NULL,
	"doctor_id" integer NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"last_updated" date DEFAULT 'now()' NOT NULL,
	CONSTRAINT "unique_date_doctor" UNIQUE("date","doctor_id")
);
--> statement-breakpoint
CREATE TABLE "specializations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "specializations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	CONSTRAINT "specializations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "token_info" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "token_info_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"doctor_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"token_date" date NOT NULL,
	"queue_num" integer NOT NULL,
	"description" varchar(1000),
	"created_at" date DEFAULT 'now()' NOT NULL,
	CONSTRAINT "unique_doctor_date_queue" UNIQUE("doctor_id","token_date","queue_num")
);
--> statement-breakpoint
CREATE TABLE "user_info" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"password" varchar(255) NOT NULL,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"active_token_version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"add_date" date DEFAULT 'now()' NOT NULL,
	CONSTRAINT "user_role_pk" UNIQUE("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"username" varchar(255),
	"email" varchar(255),
	"mobile" varchar(255) NOT NULL,
	"join_date" date DEFAULT 'now()' NOT NULL,
	"address" varchar(500),
	"profile_pic_url" varchar(255),
	CONSTRAINT "users_mobile_unique" UNIQUE("mobile"),
	CONSTRAINT "unique_mobile" UNIQUE("mobile"),
	CONSTRAINT "unique_email" UNIQUE("email"),
	CONSTRAINT "unique_username" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_doctor_id_doctor_info_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_info" ADD CONSTRAINT "doctor_info_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_secretaries" ADD CONSTRAINT "doctor_secretaries_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_secretaries" ADD CONSTRAINT "doctor_secretaries_secretary_id_users_id_fk" FOREIGN KEY ("secretary_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_specializations" ADD CONSTRAINT "doctor_specializations_doctor_id_doctor_info_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_specializations" ADD CONSTRAINT "doctor_specializations_specialization_id_specializations_id_fk" FOREIGN KEY ("specialization_id") REFERENCES "public"."specializations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospital_employees" ADD CONSTRAINT "hospital_employees_hospital_id_hospital_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospital"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospital_employees" ADD CONSTRAINT "hospital_employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospital_specializations" ADD CONSTRAINT "hospital_specializations_hospital_id_hospital_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospital"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospital_specializations" ADD CONSTRAINT "hospital_specializations_specialization_id_specializations_id_fk" FOREIGN KEY ("specialization_id") REFERENCES "public"."specializations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "running_counter" ADD CONSTRAINT "running_counter_doctor_id_doctor_info_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_info" ADD CONSTRAINT "token_info_doctor_id_doctor_info_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_info" ADD CONSTRAINT "token_info_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_info" ADD CONSTRAINT "user_info_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_role_info_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role_info"("id") ON DELETE no action ON UPDATE no action;