// hooks/useRAGContext.ts
import { useEffect, useState } from 'react';
import { projectStore } from '../services/projectStore';
import { embeddingsService } from '../services/localEmbeddingsService';
import { improvedVectorStore } from '../services/improvedVectorStore';
import { Vector } from '../types/types';

interface DocumentContext {
  content: string;
  fileName: string;
  similarity: number;
}

// Add to useRAGContext.ts

export const useRAGContext = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVectorStoreReady, setVectorStoreReady] = useState(false);

  useEffect(() => {
    const handleVectorsUpdated = () => {
      setVectorStoreReady(true);
      console.log('Vector store updated and ready');
    };

    // Listen for vector store updates
    window.addEventListener('vectors-updated', handleVectorsUpdated);
    
    // Initial check
    improvedVectorStore.init().then(() => {
      setVectorStoreReady(true);
    });

    return () => {
      window.removeEventListener('vectors-updated', handleVectorsUpdated);
    };
  }, []);
    
  const getRelevantContext = async (query: string): Promise<string> => {
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

      console.log('Active projects:', activeProjects);  // Debug log

      if (activeProjects.length === 0) {
        console.log('No active projects found');  // Debug log
        return '';
      }

      // Generate query embedding
      const queryEmbedding = await embeddingsService.generateQueryEmbedding(query);
      console.log('Generated query embedding');  // Debug log

      // Search for relevant vectors
      console.log('Searching for similar vectors...');  // Debug log
      const results: Vector[] = await improvedVectorStore.findSimilarVectors(
        queryEmbedding,
        activeProjects,
        5
      );
      console.log('Found similar vectors:', results.length);  // Debug log

      // Get document contents
      const contexts = await Promise.all(
        results.map(async (result): Promise<DocumentContext | null> => {
          try {
            console.log('Loading document:', result.metadata.fileName);  // Debug log
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
      console.log('Valid contexts found:', validContexts.length);  // Debug log

      if (validContexts.length === 0) {
        console.log('No valid contexts found');  // Debug log
        return '';
      }

      // Format contexts into a single string
      const formattedContext = validContexts
        .map(ctx => {
          const similarityPercentage = Math.round(ctx.similarity * 100);
          return `[${ctx.fileName}] (${similarityPercentage}% relevant):\n${ctx.content}\n`;
        })
        .join('\n---\n\n');

      console.log('Generated context with length:', formattedContext.length);  // Debug log
      return `Relevant context from your documents:\n\n${formattedContext}\n\nPlease use this context to inform your response while maintaining a natural conversation flow.`;

    } catch (error) {
      console.error('Error getting RAG context:', error);
      setError(error instanceof Error ? error.message : 'Failed to retrieve context from documents');
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getRelevantContext,
    isLoading,
    error
  };
};