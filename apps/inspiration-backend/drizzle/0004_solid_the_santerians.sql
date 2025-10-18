ALTER TABLE "doctor_specializations" DROP CONSTRAINT "doctor_specializations_doctor_id_doctor_info_id_fk";
--> statement-breakpoint
ALTER TABLE "doctor_specializations" ADD CONSTRAINT "doctor_specializations_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;