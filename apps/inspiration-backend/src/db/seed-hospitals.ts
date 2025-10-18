import { sql } from "drizzle-orm";
import { db } from "./db_index";
import { hospitalTable } from "./schema";

/**
 * Seeds the hospitals table with initial data
 */
export async function seedHospitals() {
  try {
    // Check if we already have hospitals in the table
    const existingHospitals = await db.select().from(hospitalTable).limit(1);
    
    if (existingHospitals.length > 0) {
      console.log("Hospitals table already has data, skipping seed");
      return;
    }
    
    // Sample hospital data
    const hospitals = [
      {
        name: "City General Hospital",
        description: "A major public hospital serving the city",
        address: "123 Main Street, Downtown"
      },
      {
        name: "Community Health Center",
        description: "Neighborhood healthcare facility for local residents",
        address: "456 Park Avenue, Westside"
      },
      {
        name: "Children's Medical Center",
        description: "Specialized hospital for pediatric care",
        address: "789 Hospital Drive, Northend"
      }
    ];
    
    // Insert sample hospitals
    for (const hospital of hospitals) {
      await db.insert(hospitalTable).values({
        name: hospital.name,
        description: hospital.description,
        address: hospital.address
      });
    }
    
    console.log(`Successfully seeded ${hospitals.length} hospitals`);
  } catch (error) {
    console.error("Error seeding hospitals:", error);
    throw error;
  }
}
