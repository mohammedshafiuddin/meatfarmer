ALTER TABLE "doctor_info" ALTER COLUMN "daily_token_count" SET DEFAULT 20;--> statement-breakpoint
ALTER TABLE "doctor_info" ADD COLUMN "consultation_fee" numeric(10, 2) DEFAULT '0' NOT NULL;