CREATE TABLE "offline_tokens" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "offline_tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"doctor_id" integer NOT NULL,
	"token_num" integer NOT NULL,
	"description" varchar(1000),
	"patientName" varchar(255) NOT NULL,
	"mobileNumber" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"created_at" date DEFAULT 'now()' NOT NULL,
	CONSTRAINT "unique_doctor_date_token_num" UNIQUE("doctor_id","date","token_num")
);
--> statement-breakpoint
ALTER TABLE "offline_tokens" ADD CONSTRAINT "offline_tokens_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;