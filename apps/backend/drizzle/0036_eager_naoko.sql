CREATE TABLE "mf"."coupon_applicable_products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."coupon_applicable_products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"coupon_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	CONSTRAINT "unique_coupon_product" UNIQUE("coupon_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "mf"."coupon_applicable_users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."coupon_applicable_users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"coupon_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "unique_coupon_user" UNIQUE("coupon_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "mf"."coupon_usage" ADD COLUMN "order_item_id" integer;--> statement-breakpoint
ALTER TABLE "mf"."order_items" ADD COLUMN "discounted_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "mf"."coupon_applicable_products" ADD CONSTRAINT "coupon_applicable_products_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "mf"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."coupon_applicable_products" ADD CONSTRAINT "coupon_applicable_products_product_id_product_info_id_fk" FOREIGN KEY ("product_id") REFERENCES "mf"."product_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."coupon_applicable_users" ADD CONSTRAINT "coupon_applicable_users_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "mf"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."coupon_applicable_users" ADD CONSTRAINT "coupon_applicable_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mf"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."coupon_usage" ADD CONSTRAINT "coupon_usage_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "mf"."order_items"("id") ON DELETE no action ON UPDATE no action;