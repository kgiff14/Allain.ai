// services/initServices.ts
import { fsService } from './fsService';
import { improvedVectorStore } from './improvedVectorStore';
import { embeddingsService } from './localEmbeddingsService';
import { personaStore } from './personaStore';
import { projectStore } from './projectStore';

export const initializeServices = async () => {
  try {
    // Initialize file system
    if (typeof window !== 'undefined') {
      window.fs = fsService;
      await fsService.ensureDB();
    }

    // Initialize stores
    projectStore.init();
    personaStore.init();
    
    // Initialize the improved vector store
    await improvedVectorStore.init();

    // Pre-load the embeddings model
    try {
      await embeddingsService.generateEmbedding('test');
      console.log('Embeddings model initialized successfully');
    } catch (error) {
      console.error('Error initializing embeddings model:', error);
    }
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
    throw error;
  }
};