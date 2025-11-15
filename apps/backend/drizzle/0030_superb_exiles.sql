CREATE TABLE "mf"."store_info" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."store_info_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"owner" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mf"."product_info" ADD COLUMN "store_id" integer;--> statement-breakpoint
ALTER TABLE "mf"."store_info" ADD CONSTRAINT "store_info_owner_staff_users_id_fk" FOREIGN KEY ("owner") REFERENCES "mf"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."product_info" ADD CONSTRAINT "product_info_store_id_store_info_id_fk" FOREIGN KEY ("store_id") REFERENCES "mf"."store_info"("id") ON DELETE no action ON UPDATE no action;