CREATE TABLE "mf"."staff_users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."staff_users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mf"."user_creds" DROP CONSTRAINT "unique_user_cred";--> statement-breakpoint
ALTER TABLE "mf"."addresses" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;