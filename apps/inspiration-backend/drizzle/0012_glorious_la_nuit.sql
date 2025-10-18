ALTER TABLE "payment_info" ADD COLUMN "order_id" varchar(500);--> statement-breakpoint
ALTER TABLE "payment_info" DROP COLUMN "orderId";