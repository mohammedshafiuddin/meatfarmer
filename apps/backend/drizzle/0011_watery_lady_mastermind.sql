ALTER TABLE "mf"."coupons" ADD COLUMN "is_apply_for_all" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mf"."coupons" ADD COLUMN "valid_till" timestamp;--> statement-breakpoint
ALTER TABLE "mf"."coupons" ADD COLUMN "max_limit_for_user" integer;