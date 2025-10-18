"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedHospitals = seedHospitals;
const db_index_1 = require("./db_index");
const schema_1 = require("./schema");
/**
 * Seeds the hospitals table with initial data
 */
async function seedHospitals() {
    try {
        // Check if we already have hospitals in the table
        const existingHospitals = await db_index_1.db.select().from(schema_1.hospitalTable).limit(1);
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
            await db_index_1.db.insert(schema_1.hospitalTable).values({
                name: hospital.name,
                description: hospital.description,
                address: hospital.address
            });
        }
        console.log(`Successfully seeded ${hospitals.length} hospitals`);
    }
    catch (error) {
        console.error("Error seeding hospitals:", error);
        throw error;
    }
}
