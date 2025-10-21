ALTER TABLE "mf"."coupons" ADD COLUMN "coupon_code" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "mf"."coupons" ADD CONSTRAINT "unique_coupon_code" UNIQUE("coupon_code");