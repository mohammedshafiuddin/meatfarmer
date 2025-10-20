CREATE TABLE "mf"."order_status" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."order_status_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_time" timestamp DEFAULT now() NOT NULL,
	"user_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"is_packaged" boolean DEFAULT false NOT NULL,
	"is_delivered" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mf"."payment_info" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."payment_info_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"status" varchar(50) NOT NULL,
	"gateway" varchar(50) NOT NULL,
	"order_id" varchar(500),
	"token" varchar(500),
	"merchant_order_id" varchar(255) NOT NULL,
	"payload" jsonb,
	CONSTRAINT "payment_info_merchant_order_id_unique" UNIQUE("merchant_order_id")
);
--> statement-breakpoint
ALTER TABLE "mf"."order_items" ALTER COLUMN "quantity" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "mf"."orders" ALTER COLUMN "slot_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "mf"."addresses" ADD COLUMN "name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "mf"."addresses" ADD COLUMN "phone" varchar(15) NOT NULL;--> statement-breakpoint
ALTER TABLE "mf"."addresses" ADD COLUMN "address_line1" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "mf"."addresses" ADD COLUMN "address_line2" varchar(255);--> statement-breakpoint
ALTER TABLE "mf"."addresses" ADD COLUMN "city" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "mf"."addresses" ADD COLUMN "state" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "mf"."addresses" ADD COLUMN "pincode" varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE "mf"."addresses" ADD COLUMN "latitude" real;--> statement-breakpoint
ALTER TABLE "mf"."addresses" ADD COLUMN "longitude" real;--> statement-breakpoint
ALTER TABLE "mf"."orders" ADD COLUMN "is_cod" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mf"."orders" ADD COLUMN "is_online_payment" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mf"."orders" ADD COLUMN "payment_info_id" integer;--> statement-breakpoint
ALTER TABLE "mf"."order_status" ADD CONSTRAINT "order_status_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mf"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."order_status" ADD CONSTRAINT "order_status_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "mf"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."orders" ADD CONSTRAINT "orders_payment_info_id_payment_info_id_fk" FOREIGN KEY ("payment_info_id") REFERENCES "mf"."payment_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."addresses" DROP COLUMN "address";--> statement-breakpoint
ALTER TABLE "mf"."order_items" DROP COLUMN "amount";--> statement-breakpoint
ALTER TABLE "mf"."orders" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."order_status";