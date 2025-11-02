CREATE TABLE "mf"."vendor_snippets" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."vendor_snippets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"snippet_code" varchar(255) NOT NULL,
	"slot_id" integer NOT NULL,
	"product_ids" integer[] NOT NULL,
	"valid_till" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_snippets_snippet_code_unique" UNIQUE("snippet_code")
);
--> statement-breakpoint
ALTER TABLE "mf"."vendor_snippets" ADD CONSTRAINT "vendor_snippets_slot_id_delivery_slot_info_id_fk" FOREIGN KEY ("slot_id") REFERENCES "mf"."delivery_slot_info"("id") ON DELETE no action ON UPDATE no action;