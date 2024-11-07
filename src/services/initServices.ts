// services/initServices.ts
import { fsService } from './fsService';

export const initializeServices = async () => {
  try {
    // Initialize file system
    if (typeof window !== 'undefined') {
      window.fs = fsService;
      await fsService.ensureDB();
    }
    
    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
    throw error;
  }
};