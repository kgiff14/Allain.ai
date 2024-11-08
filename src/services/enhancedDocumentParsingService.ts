// services/documentProcessingService.ts
import { v4 as uuidv4 } from 'uuid';
import { ProjectDocument } from '../types/project';
import { embeddingsService } from './localEmbeddingsService';
import { vectorStore } from './vectorStoreService';
import { getFileExtension, isCodeFile } from '../utils/fileTypes';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
const CHUNK_SIZE = 1000; // Characters per chunk for text
const OVERLAP_SIZE = 100;
const CODE_CHUNK_SIZE = 25; // Lines for code files
const PROCESSING_BATCH_SIZE = 3;

interface ProcessingOptions {
  onProgress?: (progress: number) => void;
}

class DocumentProcessingService {
  private async* generateTextChunks(text: string): AsyncGenerator<string> {
    let currentIndex = 0;
    
    while (currentIndex < text.length) {
      const endIndex = Math.min(currentIndex + CHUNK_SIZE, text.length);
      const chunk = text.slice(currentIndex, endIndex);
      yield chunk;
      
      // Move forward while accounting for overlap
      currentIndex = endIndex - OVERLAP_SIZE;
      if (currentIndex >= text.length) break;
      
      // Prevent infinite loop
      if (currentIndex <= 0) break;
    }
  }

  private async* generateCodeChunks(code: string): AsyncGenerator<{
    text: string;
    startLine: number;
    endLine: number;
  }> {
    const lines = code.split('\n');
    let currentLine = 0;

    while (currentLine < lines.length) {
      const endLine = Math.min(currentLine + CODE_CHUNK_SIZE, lines.length);
      const chunkLines = lines.slice(currentLine, endLine);
      
      yield {
        text: chunkLines.join('\n'),
        startLine: currentLine + 1,
        endLine: endLine
      };

      currentLine = endLine;
      if (currentLine >= lines.length) break;
    }
  }

  private async processChunkBatch<T>(
    chunks: T[],
    processor: (chunk: T) => Promise<void>
  ): Promise<void> {
    try {
      await Promise.all(
        chunks.map(async (chunk) => {
          try {
            await processor(chunk);
          } catch (error) {
            console.error('Error processing chunk:', error);
            throw error;
          }
        })
      );

      // Add a small delay between batches to prevent memory buildup
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error('Error processing batch:', error);
      throw error;
    }
  }

  private async processTextContent(
    content: string,
    documentId: string,
    projectId: string,
    fileName: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    let processedChunks = 0;
    const totalChunks = Math.ceil(content.length / CHUNK_SIZE);
    
    for await (const chunk of this.generateTextChunks(content)) {
      await this.processChunkBatch([chunk], async (text) => {
        const embedding = await embeddingsService.generateEmbedding(text);
        await vectorStore.addVector({
          id: uuidv4(),
          vector: embedding,
          metadata: {
            documentId,
            projectId,
            fileName,
            chunkIndex: processedChunks,
            contentType: 'text'
          }
        });
      });
  
      processedChunks++;
      if (onProgress) {
        // Calculate and call progress callback after each chunk
        const progress = (processedChunks / totalChunks) * 100;
        onProgress(Math.min(progress, 100));
      }
      
      // Add small delay to prevent UI freezing
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private async processCodeContent(
    content: string,
    documentId: string,
    projectId: string,
    fileName: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    let processedChunks = 0;
    let currentBatch: Array<{
      text: string;
      startLine: number;
      endLine: number;
    }> = [];

    for await (const chunk of this.generateCodeChunks(content)) {
      currentBatch.push(chunk);

      if (currentBatch.length >= PROCESSING_BATCH_SIZE) {
        await this.processChunkBatch(currentBatch, async (codeChunk) => {
          const embedding = await embeddingsService.generateEmbedding(codeChunk.text);
          await vectorStore.addVector({
            id: uuidv4(),
            vector: embedding,
            metadata: {
              documentId,
              projectId,
              fileName,
              startLine: codeChunk.startLine,
              endLine: codeChunk.endLine,
              contentType: 'code'
            }
          });
        });

        processedChunks += currentBatch.length;
        if (onProgress) {
          const totalChunks = Math.ceil(content.split('\n').length / CODE_CHUNK_SIZE);
          onProgress((processedChunks / totalChunks) * 100);
        }
        currentBatch = [];
      }
    }

    // Process remaining chunks
    if (currentBatch.length > 0) {
      await this.processChunkBatch(currentBatch, async (codeChunk) => {
        const embedding = await embeddingsService.generateEmbedding(codeChunk.text);
        await vectorStore.addVector({
          id: uuidv4(),
          vector: embedding,
          metadata: {
            documentId,
            projectId,
            fileName,
            startLine: codeChunk.startLine,
            endLine: codeChunk.endLine,
            contentType: 'code'
          }
        });
      });
    }
  }

  async processDocument(
    file: File,
    projectId: string,
    options: ProcessingOptions = {}
  ): Promise<ProjectDocument> {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    const extension = getFileExtension(file.name);
    if (!extension) {
      throw new Error(`Unsupported file type: ${file.name}`);
    }

    try {
      // Read file content
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

      // Store raw content
      await window.fs.writeFile(file.name, content);

      // Process content based on file type
      if (isCodeFile(extension)) {
        await this.processCodeContent(
          content,
          document.id,
          projectId,
          file.name,
          options.onProgress
        );
      } else {
        await this.processTextContent(
          content,
          document.id,
          projectId,
          file.name,
          options.onProgress
        );
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
      const DELETION_BATCH_SIZE = 50;
      let deleted = 0;
      
      while (true) {
        const vectors = await vectorStore.getVectorsByMetadata(
          { documentId },
          DELETION_BATCH_SIZE
        );
        
        if (vectors.length === 0) break;
        
        await Promise.all(
          vectors.map(vector => vectorStore.deleteVector(vector.id))
        );
        
        deleted += vectors.length;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error('Error deleting document vectors:', error);
      throw error;
    }
  }
}

export const documentProcessingService = new DocumentProcessingService();