ALTER TABLE "doctor_availability" ADD COLUMN "is_paused" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "doctor_availability" ADD COLUMN "is_leave" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "doctor_availability" ADD COLUMN "pause_reason" text;