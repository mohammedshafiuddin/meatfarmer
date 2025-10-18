ALTER TABLE "running_counter" DROP CONSTRAINT "running_counter_doctor_id_doctor_info_id_fk";
--> statement-breakpoint
ALTER TABLE "token_info" DROP CONSTRAINT "token_info_doctor_id_doctor_info_id_fk";
--> statement-breakpoint
ALTER TABLE "token_info" DROP CONSTRAINT "token_info_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "running_counter" ADD CONSTRAINT "running_counter_doctor_id_doctor_info_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor_info"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_info" ADD CONSTRAINT "token_info_doctor_id_doctor_info_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor_info"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_info" ADD CONSTRAINT "token_info_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;