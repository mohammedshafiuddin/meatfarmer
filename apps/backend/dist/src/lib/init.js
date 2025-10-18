"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initFunc = void 0;
const roles_manager_1 = __importDefault(require("./roles-manager"));
/**
 * Initialize all application services
 * This function handles initialization of:
 * - Role Manager (fetches and caches all roles)
 * - Other services can be added here in the future
 */
const initFunc = async () => {
    try {
        console.log('Starting application initialization...');
        // Initialize role manager
        await roles_manager_1.default.fetchRoles();
        console.log('Role manager initialized successfully');
        // Add other initialization tasks here as needed
        console.log('Application initialization completed successfully');
    }
    catch (error) {
        console.error('Application initialization failed:', error);
        throw error;
    }
};
exports.initFunc = initFunc;
exports.default = exports.initFunc;
