import roleManager from './roles-manager';
import './notif-job';

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

    // Notification queue and worker are initialized via import
    console.log('Notification queue and worker initialized');
    
    console.log('Application initialization completed successfully');
  } catch (error) {
    console.error('Application initialization failed:', error);
    throw error;
  }
};

export default initFunc;
