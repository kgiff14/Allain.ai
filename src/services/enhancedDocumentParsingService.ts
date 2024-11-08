// services/documentProcessingService.ts
import { v4 as uuidv4 } from 'uuid';
import { ProjectDocument } from '../types/project';
import { embeddingsService } from './localEmbeddingsService';
import { vectorStore } from './vectorStoreService';
import { getFileExtension, isCodeFile } from '../utils/fileTypes';

const CHUNK_SIZE = 512; // Characters per chunk
const CHUNK_OVERLAP = 50; // Characters of overlap between chunks
const CODE_CHUNK_SIZE = 20; // Lines for code files

interface ProcessingOptions {
  onProgress?: (progress: number) => void;
}

class DocumentProcessingService {
  private async processTextChunks(text: string, documentId: string, projectId: string, fileName: string) {
    const chunks: string[] = [];
    let currentIndex = 0;

    // Split text into chunks with overlap
    while (currentIndex < text.length) {
      const chunkEnd = Math.min(currentIndex + CHUNK_SIZE, text.length);
      const chunk = text.slice(currentIndex, chunkEnd);
      chunks.push(chunk);
      currentIndex = chunkEnd - CHUNK_OVERLAP;
      if (currentIndex >= text.length) break;
    }

    // Process chunks in batches to manage memory
    const BATCH_SIZE = 5;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      
      // Process batch
      await Promise.all(batchChunks.map(async (chunk, index) => {
        const embedding = await embeddingsService.generateEmbedding(chunk);
        
        await vectorStore.addVector({
          id: uuidv4(),
          vector: embedding,
          metadata: {
            documentId,
            projectId,
            fileName,
            startIndex: (i + index) * (CHUNK_SIZE - CHUNK_OVERLAP),
            endIndex: (i + index) * (CHUNK_SIZE - CHUNK_OVERLAP) + chunk.length
          }
        });
      }));

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }

  private async processCodeChunks(code: string, documentId: string, projectId: string, fileName: string) {
    const lines = code.split('\n');
    const chunks: { text: string; startLine: number; }[] = [];
    
    // Split code into chunks by lines
    for (let i = 0; i < lines.length; i += CODE_CHUNK_SIZE) {
      const chunkLines = lines.slice(i, i + CODE_CHUNK_SIZE);
      chunks.push({
        text: chunkLines.join('\n'),
        startLine: i + 1
      });
    }

    // Process code chunks in smaller batches
    const BATCH_SIZE = 3;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batchChunks.map(async (chunk) => {
        const embedding = await embeddingsService.generateEmbedding(chunk.text);
        
        await vectorStore.addVector({
          id: uuidv4(),
          vector: embedding,
          metadata: {
            documentId,
            projectId,
            fileName,
            startLine: chunk.startLine,
            endLine: chunk.startLine + chunk.text.split('\n').length - 1
          }
        });
      }));

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }

  async processDocument(
    file: File,
    projectId: string,
    options: ProcessingOptions = {}
  ): Promise<ProjectDocument> {
    const extension = getFileExtension(file.name);
    if (!extension) {
      throw new Error(`Unsupported file type: ${file.name}`);
    }

    try {
      // Read file content in chunks
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      // Create document metadata
      const document: ProjectDocument = {
        id: uuidv4(),
        projectId,
        name: file.name,
        type: file.type,
        uploadedAt: new Date()
      };

      // Store content
      await window.fs.writeFile(file.name, content);

      // Process content based on file type
      if (isCodeFile(extension)) {
        await this.processCodeChunks(content, document.id, projectId, file.name);
      } else {
        await this.processTextChunks(content, document.id, projectId, file.name);
      }

      return document;
    } catch (error) {
      // Cleanup in case of error
      try {
        await window.fs.unlink(file.name);
      } catch (e) {
        console.error('Error cleaning up file:', e);
      }
      throw error;
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      // Delete vectors in batches
      const BATCH_SIZE = 100;
      let deleted = 0;
      
      while (true) {
        const vectors = await vectorStore.getVectorsByMetadata({ documentId }, BATCH_SIZE);
        if (vectors.length === 0) break;
        
        await Promise.all(vectors.map(vector => 
          vectorStore.deleteVector(vector.id)
        ));
        
        deleted += vectors.length;
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
    } catch (error) {
      console.error('Error deleting document vectors:', error);
      throw error;
    }
  }
}

export const documentProcessingService = new DocumentProcessingService();