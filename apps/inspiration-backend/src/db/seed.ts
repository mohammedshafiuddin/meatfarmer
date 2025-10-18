import { db } from './db_index.js';
import {
  roleInfoTable,
  specializationsTable,
} from './schema.js';

/**
 * Seeds the database with initial data
 * Adds roles: gen_user, doctor, hospital_assistant, admin, hospital_admin
 * Adds common medical specializations
 */
export async function seed() {
  try {
    console.log('Starting database seeding...');

    // Define the roles we want to ensure exist
    const rolesToSeed = [
      { name: 'gen_user', displayName: 'General User', description: 'General user with basic access' },
      { name: 'doctor', displayName: 'Doctor', description: 'Medical professional who can manage patients and appointments' },
      { name: 'hospital_assistant', displayName: 'Hospital Assistant', description: 'Assists in hospital operations and scheduling' },
      { name: 'admin', displayName: 'Administrator', description: 'System administrator with full access to all features' },
      { name: 'hospital_admin', displayName: 'Hospital Admin', description: 'Administrator for hospital management and operations' }
    ];

    // Get existing roles from the database
    const existingRoles = await db.select().from(roleInfoTable);
    const existingRoleNames = new Set(existingRoles.map(role => role.name));

    // Filter out roles that already exist
    const newRoles = rolesToSeed.filter(role => !existingRoleNames.has(role.name));

    // Insert only new roles
    let insertedRoles: { id: number; name: string }[] = [];
    if (newRoles.length > 0) {
      console.log(`Inserting ${newRoles.length} new roles...`);
      insertedRoles = await db.insert(roleInfoTable)
        .values(newRoles)
        .returning({ id: roleInfoTable.id, name: roleInfoTable.name });
      
    } else {
      console.log('All roles already exist. No new roles added.');
    }
    
    // Get all roles (existing + newly inserted)
    const allRoles = await db.select().from(roleInfoTable);
    
    // Create a map of role names to role IDs
    const roleMap = new Map<string, number>();
    allRoles.forEach(role => {
      roleMap.set(role.name, role.id);
    });

    // Define the specializations we want to ensure exist
    const specializationsToSeed = [
      { name: 'General Physician', description: 'Primary care doctor who treats acute and chronic illnesses and provides preventive care' },
      { name: 'General Surgeon', description: 'Performs various types of surgical procedures on many areas of the body' },
      { name: 'Cardiology', description: 'Deals with disorders of the heart and cardiovascular system' },
      { name: 'Dermatology', description: 'Focuses on diseases of the skin, hair, and nails' },
      { name: 'Neurology', description: 'Treats disorders of the nervous system' },
      { name: 'Pediatrics', description: 'Provides medical care for infants, children, and adolescents' },
      { name: 'Orthopedics', description: 'Deals with conditions involving the musculoskeletal system' },
      { name: 'Ophthalmology', description: 'Focuses on eye and vision care' },
      { name: 'ENT', description: 'Treats ear, nose, and throat conditions' },
      { name: 'Psychiatry', description: 'Deals with mental, emotional, and behavioral disorders' },
      { name: 'Gynecology', description: 'Focuses on women\'s reproductive health' },
      { name: 'Internal Medicine', description: 'Deals with prevention, diagnosis, and treatment of adult diseases' }
    ];

    // Get existing specializations from the database
    const existingSpecializations = await db.select().from(specializationsTable);
    const existingSpecializationNames = new Set(existingSpecializations.map(spec => spec.name));

    // Filter out specializations that already exist
    const newSpecializations = specializationsToSeed.filter(spec => !existingSpecializationNames.has(spec.name));

    // Insert only new specializations
    if (newSpecializations.length > 0) {
      console.log(`Inserting ${newSpecializations.length} new specializations...`);
      await db.insert(specializationsTable).values(newSpecializations);
      console.log('Successfully added new specializations.');
    } else {
      console.log('All specializations already exist. No new specializations added.');
    }

    return { roleMap, newRolesAdded: insertedRoles };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

export default seed;