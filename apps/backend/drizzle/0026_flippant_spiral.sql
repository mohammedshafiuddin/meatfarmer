CREATE TYPE "public"."payment_status" AS ENUM('pending', 'success', 'cod', 'failed');--> statement-breakpoint
ALTER TABLE "mf"."order_status" RENAME COLUMN "is_payment_processed" TO "payment_status";