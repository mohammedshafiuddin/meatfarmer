CREATE TABLE "notif_creds" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notif_creds_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer,
	"push_token" varchar(255) NOT NULL,
	"added_on" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer,
	"title" varchar(255) NOT NULL,
	"body" varchar(512) NOT NULL,
	"image_url" varchar(255),
	"redirect_url" varchar(255),
	"added_on" timestamp with time zone DEFAULT now() NOT NULL,
	"token_id" integer,
	"payload" jsonb
);
--> statement-breakpoint
ALTER TABLE "notif_creds" ADD CONSTRAINT "notif_creds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_token_id_token_info_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."token_info"("id") ON DELETE no action ON UPDATE no action;