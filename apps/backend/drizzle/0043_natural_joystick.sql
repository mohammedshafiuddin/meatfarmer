CREATE TYPE "public"."upload_status" AS ENUM('pending', 'claimed');--> statement-breakpoint
CREATE TABLE "mf"."product_reviews" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."product_reviews_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"review_body" text NOT NULL,
	"image_urls" jsonb,
	"review_time" timestamp DEFAULT now() NOT NULL,
	"ratings" real NOT NULL,
	"admin_response" text,
	"admin_response_images" jsonb,
	CONSTRAINT "rating_check" CHECK ("mf"."product_reviews"."ratings" >= 1 AND "mf"."product_reviews"."ratings" <= 5)
);
--> statement-breakpoint
CREATE TABLE "mf"."upload_url_status" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."upload_url_status_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"key" varchar(500) NOT NULL,
	"status" "upload_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mf"."product_reviews" ADD CONSTRAINT "product_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mf"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."product_reviews" ADD CONSTRAINT "product_reviews_product_id_product_info_id_fk" FOREIGN KEY ("product_id") REFERENCES "mf"."product_info"("id") ON DELETE no action ON UPDATE no action;