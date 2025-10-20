import { db } from "./db_index";
import { units, productInfo, deliverySlotInfo, productSlots } from "./schema";
import { eq } from "drizzle-orm";

export async function seed() {
  console.log("Seeding database...");

  // Seed units
  await db.insert(units).values([
    { shortNotation: "Kg", fullName: "Kilogram" },
    { shortNotation: "L", fullName: "Litre" },
    { shortNotation: "Dozen", fullName: "Dozen" },
    { shortNotation: "Unit", fullName: "Unit Piece" },
  ]);

  console.log("Seeding completed.");
}