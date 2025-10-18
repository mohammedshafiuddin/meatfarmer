ALTER TABLE "token_payments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "token_payments" CASCADE;--> statement-breakpoint
ALTER TABLE "token_info" ADD COLUMN "payment_id" integer;--> statement-breakpoint
ALTER TABLE "token_info" ADD CONSTRAINT "token_info_payment_id_payment_info_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment_info"("id") ON DELETE no action ON UPDATE no action;