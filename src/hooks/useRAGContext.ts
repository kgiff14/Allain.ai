// hooks/useRAGContext.ts
import { useEffect, useState, useCallback } from 'react';
import { projectStore } from '../services/projectStore';
import { embeddingsService } from '../services/localEmbeddingsService';
import { improvedVectorStore } from '../services/improvedVectorStore';
import { Vector } from '../types/types';

interface DocumentContext {
  content: string;
  fileName: string;
  similarity: number;
}

export const useRAGContext = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVectorStoreReady, setVectorStoreReady] = useState(false);
  const [lastDeleteTime, setLastDeleteTime] = useState<number>(0);

  // Initialize and handle vector store updates
  useEffect(() => {
    const handleVectorsUpdated = () => {
      setVectorStoreReady(true);
      console.log('Vector store updated and ready');
    };

    const handleDocumentDeleted = () => {
      setLastDeleteTime(Date.now());
      console.log('Document deletion detected, updating context...');
    };

    // Listen for vector store and document updates
    window.addEventListener('vectors-updated', handleVectorsUpdated);
    window.addEventListener('document-deleted', handleDocumentDeleted);
    
    // Initial check
    improvedVectorStore.init().then(() => {
      setVectorStoreReady(true);
    });

    return () => {
      window.removeEventListener('vectors-updated', handleVectorsUpdated);
      window.removeEventListener('document-deleted', handleDocumentDeleted);
    };
  }, []);

  const validateDocumentExists = useCallback(async (fileName: string): Promise<boolean> => {
    try {
      const content = await window.fs.readFile(fileName, { encoding: 'utf8' });
      return true;
    } catch (error) {
      console.log(`File ${fileName} no longer exists`);
      return false;
    }
  }, []);

  const getRelevantContext = useCallback(async (query: string): Promise<string> => {
    try {
      if (!isVectorStoreReady) {
        console.log('Waiting for vector store to be ready...');
        await new Promise(resolve => 
          window.addEventListener('vectors-updated', resolve, { once: true })
        );
      }

      setIsLoading(true);
      setError(null);

      // Get active projects
      const activeProjects = projectStore.getAllProjects()
        .filter(project => project.isActive)
        .map(project => project.id);

      console.log('Active projects:', activeProjects);

      if (activeProjects.length === 0) {
        console.log('No active projects found');
        return '';
      }

      // Generate query embedding
      const queryEmbedding = await embeddingsService.generateQueryEmbedding(query);
      console.log('Generated query embedding');

      // Search for relevant vectors
      console.log('Searching for similar vectors...');
      const results: Vector[] = await improvedVectorStore.findSimilarVectors(
        queryEmbedding,
        activeProjects,
        5
      );
      console.log('Found similar vectors:', results.length);

      // Get document contents with validation
      const contexts = await Promise.all(
        results.map(async (result): Promise<DocumentContext | null> => {
          try {
            // Validate file still exists
            const exists = await validateDocumentExists(result.metadata.fileName);
            if (!exists) {
              console.log(`Skipping missing file: ${result.metadata.fileName}`);
              // Clean up vector store entry for missing file
              await improvedVectorStore.deleteDocumentVectors(result.metadata.documentId);
              return null;
            }

            console.log('Loading document:', result.metadata.fileName);
            const content = await window.fs.readFile(result.metadata.fileName, { 
              encoding: 'utf8' 
            });
            
            return {
              content,
              fileName: result.metadata.fileName,
              similarity: result.similarity || 0
            };
          } catch (error) {
            console.error(`Error loading document ${result.metadata.fileName}:`, error);
            return null;
          }
        })
      );

      // Filter out failed loads and format context
      const validContexts = contexts.filter((ctx): ctx is DocumentContext => 
        ctx !== null
      );
      console.log('Valid contexts found:', validContexts.length);

      if (validContexts.length === 0) {
        console.log('No valid contexts found');
        return '';
      }

      // Format contexts into a single string
      const formattedContext = validContexts
        .map(ctx => {
          const similarityPercentage = Math.round(ctx.similarity * 100);
          return `[${ctx.fileName}] (${similarityPercentage}% relevant):\n${ctx.content}\n`;
        })
        .join('\n---\n\n');

      console.log('Generated context with length:', formattedContext.length);
      return `Relevant context from your documents:\n\n${formattedContext}\n\nPlease use this context to inform your response while maintaining a natural conversation flow.`;

    } catch (error) {
      console.error('Error getting RAG context:', error);
      setError(error instanceof Error ? error.message : 'Failed to retrieve context from documents');
      return '';
    } finally {
      setIsLoading(false);
    }
  }, [isVectorStoreReady, validateDocumentExists, lastDeleteTime]);

  return {
    getRelevantContext,
    isLoading,
    error
  };
};