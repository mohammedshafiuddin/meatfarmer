ALTER TABLE "mf"."coupons" RENAME COLUMN "product_id" TO "product_ids";--> statement-breakpoint
ALTER TABLE "mf"."coupons" DROP CONSTRAINT "coupons_product_id_product_info_id_fk";
