ALTER TABLE "mf"."orders" ADD COLUMN "cancellation_reviewed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mf"."orders" ADD COLUMN "admin_notes" text;