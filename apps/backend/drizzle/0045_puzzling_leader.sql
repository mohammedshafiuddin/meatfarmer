CREATE TABLE "mf"."address_areas" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."address_areas_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"place_name" varchar(255) NOT NULL,
	"zone_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mf"."address_zones" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."address_zones_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"zone_name" varchar(255) NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mf"."addresses" ADD COLUMN "zone_id" integer;--> statement-breakpoint
ALTER TABLE "mf"."address_areas" ADD CONSTRAINT "address_areas_zone_id_address_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "mf"."address_zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."addresses" ADD CONSTRAINT "addresses_zone_id_address_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "mf"."address_zones"("id") ON DELETE no action ON UPDATE no action;