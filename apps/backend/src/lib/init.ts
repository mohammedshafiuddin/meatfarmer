import roleManager from './roles-manager';

/**
 * Initialize all application services
 * This function handles initialization of:
 * - Role Manager (fetches and caches all roles)
 * - Other services can be added here in the future
 */
export const initFunc = async (): Promise<void> => {
  try {
    console.log('Starting application initialization...');
    
    // Initialize role manager
    await roleManager.fetchRoles();
    console.log('Role manager initialized successfully');
    
    // Add other initialization tasks here as needed
    
    console.log('Application initialization completed successfully');
  } catch (error) {
    console.error('Application initialization failed:', error);
    throw error;
  }
};

export default initFunc;
