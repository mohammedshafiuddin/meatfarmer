CREATE TABLE "mf"."coupons" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."coupons_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"is_user_based" boolean DEFAULT false NOT NULL,
	"discount_percent" numeric(5, 2),
	"flat_discount" numeric(10, 2),
	"min_order" numeric(10, 2),
	"target_user" integer,
	"created_by" integer NOT NULL,
	"max_value" numeric(10, 2),
	"is_invalidated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mf"."coupons" ADD CONSTRAINT "coupons_target_user_users_id_fk" FOREIGN KEY ("target_user") REFERENCES "mf"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."coupons" ADD CONSTRAINT "coupons_created_by_staff_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "mf"."staff_users"("id") ON DELETE no action ON UPDATE no action;