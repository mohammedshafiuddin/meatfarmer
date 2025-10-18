ALTER TABLE "users" ADD COLUMN "mobile_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_mobile_id_mobile_numbers_id_fk" FOREIGN KEY ("mobile_id") REFERENCES "public"."mobile_numbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "mobile";