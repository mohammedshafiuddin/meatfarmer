import { roleInfoTable } from "../db/schema";
import { db } from "../db/db_index";

/**
 * Constants for role names to avoid hardcoding and typos
 */
export const ROLE_NAMES = {
  ADMIN: 'admin',
  GENERAL_USER: 'gen_user',
  HOSPITAL_ADMIN: 'hospital_admin',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist'
};

export const defaultRole = ROLE_NAMES.GENERAL_USER;

/**
 * RoleManager class to handle caching and retrieving role information
 * Provides methods to fetch roles from DB and cache them for quick access
 */
class RoleManager {
  private roles: Map<number, { id: number; name: string; description: string | null }> = new Map();
  private rolesByName: Map<string, { id: number; name: string; description: string | null }> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    // Singleton instance
  }

  /**
   * Fetch all roles from the database and cache them
   * This should be called during application startup
   */
  public async fetchRoles(): Promise<void> {
    try {
      const roles = await db.query.roleInfoTable.findMany();
      
      // Clear existing maps before adding new data
      this.roles.clear();
      this.rolesByName.clear();
      
      // Cache roles by ID and by name for quick lookup
      roles.forEach(role => {
        this.roles.set(role.id, role);
        this.rolesByName.set(role.name, role);
      });
      
      this.isInitialized = true;
      console.log(`[RoleManager] Cached ${roles.length} roles`);
    } catch (error) {
      console.error('[RoleManager] Error fetching roles:', error);
      throw error;
    }
  }

  /**
   * Get all roles from cache
   * If not initialized, fetches roles from DB first
   */
  public async getRoles(): Promise<{ id: number; name: string; description: string | null }[]> {
    if (!this.isInitialized) {
      await this.fetchRoles();
    }
    return Array.from(this.roles.values());
  }

  /**
   * Get role by ID
   * @param id Role ID
   */
  public async getRoleById(id: number): Promise<{ id: number; name: string; description: string | null } | undefined> {
    if (!this.isInitialized) {
      await this.fetchRoles();
    }
    return this.roles.get(id);
  }

  /**
   * Get role by name
   * @param name Role name
   */
  public async getRoleByName(name: string): Promise<{ id: number; name: string; description: string | null } | undefined> {
    if (!this.isInitialized) {
      await this.fetchRoles();
    }
    return this.rolesByName.get(name);
  }

  /**
   * Check if a role exists by name
   * @param name Role name
   */
  public async roleExists(name: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.fetchRoles();
    }
    return this.rolesByName.has(name);
  }

  /**
   * Get business roles (roles that are not 'admin' or 'gen_user')
   */
  public async getBusinessRoles(): Promise<{ id: number; name: string; description: string | null }[]> {
    if (!this.isInitialized) {
      await this.fetchRoles();
    }
    
    return Array.from(this.roles.values()).filter(
      role => role.name !== ROLE_NAMES.ADMIN && role.name !== ROLE_NAMES.GENERAL_USER
    );
  }

  /**
   * Force refresh the roles cache
   */
  public async refreshRoles(): Promise<void> {
    await this.fetchRoles();
  }
}

// Create a singleton instance
const roleManager = new RoleManager();

// Export the singleton instance
export default roleManager;
