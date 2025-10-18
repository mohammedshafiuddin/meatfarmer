ALTER TABLE "token_info" ALTER COLUMN "payment_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_info" ADD COLUMN "merchant_order_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_info" ADD CONSTRAINT "payment_info_merchant_order_id_unique" UNIQUE("merchant_order_id");