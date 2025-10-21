ALTER TABLE "mf"."order_status" ADD COLUMN "cancel_reason" varchar(255);--> statement-breakpoint
ALTER TABLE "mf"."order_status" ADD COLUMN "is_refund_done" boolean DEFAULT false NOT NULL;