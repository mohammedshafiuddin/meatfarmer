CREATE TYPE "public"."order_status" AS ENUM('pending', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TABLE "mf"."addresses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."addresses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"address" varchar(500) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mf"."cart_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."cart_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_product" UNIQUE("user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "mf"."delivery_slot_info" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."delivery_slot_info_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"deliveryTime" timestamp NOT NULL,
	"freezeTime" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mf"."notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" varchar(512) NOT NULL,
	"type" varchar(50),
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mf"."order_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."order_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"amount" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mf"."orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"address_id" integer NOT NULL,
	"slot_id" integer NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mf"."payments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."payments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer NOT NULL,
	"status" varchar(50) NOT NULL,
	"gateway" varchar(50) NOT NULL,
	"gateway_order_id" varchar(255),
	"amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mf"."product_categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."product_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"description" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "mf"."product_info" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."product_info_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"short_description" varchar(500),
	"long_description" varchar(1000),
	"unit_id" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"images" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mf"."product_slots" (
	"product_id" integer NOT NULL,
	"slot_id" integer NOT NULL,
	CONSTRAINT "product_slot_pk" UNIQUE("product_id","slot_id")
);
--> statement-breakpoint
CREATE TABLE "mf"."special_deals" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."special_deals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"valid_till" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mf"."units" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."units_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"short_notation" varchar(50) NOT NULL,
	"full_name" varchar(100) NOT NULL,
	CONSTRAINT "unique_short_notation" UNIQUE("short_notation")
);
--> statement-breakpoint
CREATE TABLE "mf"."users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"mobile" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_email" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "mf"."addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mf"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mf"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."cart_items" ADD CONSTRAINT "cart_items_product_id_product_info_id_fk" FOREIGN KEY ("product_id") REFERENCES "mf"."product_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mf"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "mf"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."order_items" ADD CONSTRAINT "order_items_product_id_product_info_id_fk" FOREIGN KEY ("product_id") REFERENCES "mf"."product_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mf"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."orders" ADD CONSTRAINT "orders_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "mf"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."orders" ADD CONSTRAINT "orders_slot_id_delivery_slot_info_id_fk" FOREIGN KEY ("slot_id") REFERENCES "mf"."delivery_slot_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "mf"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."product_info" ADD CONSTRAINT "product_info_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "mf"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."product_slots" ADD CONSTRAINT "product_slots_product_id_product_info_id_fk" FOREIGN KEY ("product_id") REFERENCES "mf"."product_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."product_slots" ADD CONSTRAINT "product_slots_slot_id_delivery_slot_info_id_fk" FOREIGN KEY ("slot_id") REFERENCES "mf"."delivery_slot_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."special_deals" ADD CONSTRAINT "special_deals_product_id_product_info_id_fk" FOREIGN KEY ("product_id") REFERENCES "mf"."product_info"("id") ON DELETE no action ON UPDATE no action;