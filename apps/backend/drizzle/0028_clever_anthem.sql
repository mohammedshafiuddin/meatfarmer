CREATE TABLE "mf"."notif_creds" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."notif_creds_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"token" varchar(500) NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"user_id" integer NOT NULL,
	"last_verified" timestamp,
	CONSTRAINT "notif_creds_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "mf"."notif_creds" ADD CONSTRAINT "notif_creds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mf"."users"("id") ON DELETE no action ON UPDATE no action;