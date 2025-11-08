ALTER TABLE "mf"."order_status" ADD COLUMN "payment_state" "payment_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "mf"."order_status" DROP COLUMN "payment_status";