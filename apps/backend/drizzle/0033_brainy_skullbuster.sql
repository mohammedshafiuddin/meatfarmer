CREATE TABLE "mf"."product_tag_info" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."product_tag_info_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tag_name" varchar(100) NOT NULL,
	"tag_description" varchar(500),
	"image_url" varchar(500),
	"is_dashboard_tag" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_tag_info_tag_name_unique" UNIQUE("tag_name")
);
--> statement-breakpoint
CREATE TABLE "mf"."product_tags" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."product_tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_product_tag" UNIQUE("product_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "mf"."product_tags" ADD CONSTRAINT "product_tags_product_id_product_info_id_fk" FOREIGN KEY ("product_id") REFERENCES "mf"."product_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."product_tags" ADD CONSTRAINT "product_tags_tag_id_product_tag_info_id_fk" FOREIGN KEY ("tag_id") REFERENCES "mf"."product_tag_info"("id") ON DELETE no action ON UPDATE no action;