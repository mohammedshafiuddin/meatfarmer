ALTER TABLE "payment_info" ALTER COLUMN "orderId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_info" ADD COLUMN "token" varchar(500);--> statement-breakpoint
ALTER TABLE "payment_info" ADD COLUMN "payload" json;