// hooks/useRAGContext.ts
import { useState } from 'react';
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
    
  const getRelevantContext = async (query: string): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get active projects
      const activeProjects = projectStore.getAllProjects()
        .filter(project => project.isActive)
        .map(project => project.id);

        

      if (activeProjects.length === 0) {
        return '';
      }

      // Generate query embedding
      const queryEmbedding = await embeddingsService.generateQueryEmbedding(query);

      // Search for relevant vectors
      const results: Vector[] = await improvedVectorStore.findSimilarVectors(
        queryEmbedding,
        activeProjects,
        5
      );

      // Get document contents
      const contexts = await Promise.all(
        results.map(async (result): Promise<DocumentContext | null> => {
          try {
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

      if (validContexts.length === 0) {
        return '';
      }

      // Format contexts into a single string
      const formattedContext = validContexts
        .map(ctx => {
          const similarityPercentage = Math.round(ctx.similarity * 100);
          return `[${ctx.fileName}] (${similarityPercentage}% relevant):\n${ctx.content}\n`;
        })
        .join('\n---\n\n');

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