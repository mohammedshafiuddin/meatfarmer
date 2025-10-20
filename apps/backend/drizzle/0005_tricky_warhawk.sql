CREATE TABLE "mf"."key_val_store" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" jsonb
);
--> statement-breakpoint
ALTER TABLE "mf"."orders" ADD COLUMN "readable_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "mf"."payments" ADD COLUMN "token" varchar(500);--> statement-breakpoint
ALTER TABLE "mf"."payments" ADD COLUMN "merchant_order_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "mf"."payments" ADD COLUMN "payload" jsonb;--> statement-breakpoint
ALTER TABLE "mf"."payments" DROP COLUMN "gateway_order_id";--> statement-breakpoint
ALTER TABLE "mf"."payments" DROP COLUMN "amount";--> statement-breakpoint
ALTER TABLE "mf"."payments" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "mf"."payments" ADD CONSTRAINT "payments_merchant_order_id_unique" UNIQUE("merchant_order_id");