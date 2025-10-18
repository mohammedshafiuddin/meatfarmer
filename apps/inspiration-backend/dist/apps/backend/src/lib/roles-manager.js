"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRole = exports.ROLE_NAMES = void 0;
const db_index_1 = require("../db/db_index");
/**
 * Constants for role names to avoid hardcoding and typos
 */
exports.ROLE_NAMES = {
    ADMIN: 'admin',
    GENERAL_USER: 'gen_user',
    HOSPITAL_ADMIN: 'hospital_admin',
    DOCTOR: 'doctor',
    RECEPTIONIST: 'receptionist'
};
exports.defaultRole = exports.ROLE_NAMES.GENERAL_USER;
/**
 * RoleManager class to handle caching and retrieving role information
 * Provides methods to fetch roles from DB and cache them for quick access
 */
class RoleManager {
    constructor() {
        this.roles = new Map();
        this.rolesByName = new Map();
        this.isInitialized = false;
        // Singleton instance
    }
    /**
     * Fetch all roles from the database and cache them
     * This should be called during application startup
     */
    async fetchRoles() {
        try {
            const roles = await db_index_1.db.query.roleInfoTable.findMany();
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
        }
        catch (error) {
            console.error('[RoleManager] Error fetching roles:', error);
            throw error;
        }
    }
    /**
     * Get all roles from cache
     * If not initialized, fetches roles from DB first
     */
    async getRoles() {
        if (!this.isInitialized) {
            await this.fetchRoles();
        }
        return Array.from(this.roles.values());
    }
    /**
     * Get role by ID
     * @param id Role ID
     */
    async getRoleById(id) {
        if (!this.isInitialized) {
            await this.fetchRoles();
        }
        return this.roles.get(id);
    }
    /**
     * Get role by name
     * @param name Role name
     */
    async getRoleByName(name) {
        if (!this.isInitialized) {
            await this.fetchRoles();
        }
        return this.rolesByName.get(name);
    }
    /**
     * Check if a role exists by name
     * @param name Role name
     */
    async roleExists(name) {
        if (!this.isInitialized) {
            await this.fetchRoles();
        }
        return this.rolesByName.has(name);
    }
    /**
     * Get business roles (roles that are not 'admin' or 'gen_user')
     */
    async getBusinessRoles() {
        if (!this.isInitialized) {
            await this.fetchRoles();
        }
        return Array.from(this.roles.values()).filter(role => role.name !== exports.ROLE_NAMES.ADMIN && role.name !== exports.ROLE_NAMES.GENERAL_USER);
    }
    /**
     * Force refresh the roles cache
     */
    async refreshRoles() {
        await this.fetchRoles();
    }
}
// Create a singleton instance
const roleManager = new RoleManager();
// Export the singleton instance
exports.default = roleManager;
