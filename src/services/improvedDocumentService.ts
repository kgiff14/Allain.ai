// services/improvedDocumentService.ts
import { v4 as uuidv4 } from 'uuid';
import { ProjectDocument } from '../types/project';
import { embeddingsService } from './localEmbeddingsService';
import { improvedVectorStore } from './improvedVectorStore';
import { getFileExtension, isCodeFile } from '../utils/fileTypes';
import { projectStore } from './projectStore';

interface ProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

class ImprovedDocumentService {
  private processingQueue: Map<string, ProcessingStatus> = new Map();
  private BATCH_SIZE = 5;
  private CHUNK_SIZE = 1000;
  private CODE_CHUNK_SIZE = 25;

  // Process document with better progress tracking and error handling
  async processDocument(
    file: File,
    projectId: string,
    onProgress?: (progress: number) => void
  ): Promise<ProjectDocument> {
    const processingId = `${projectId}-${file.name}-${Date.now()}`;
    this.processingQueue.set(processingId, { status: 'pending', progress: 0 });

    try {
      // Validate file
      if (!this.validateFile(file)) {
        throw new Error('Invalid file type or size');
      }

      // Create document metadata
      const document: ProjectDocument = {
        id: uuidv4(),
        projectId,
        name: file.name,
        type: file.type,
        uploadedAt: new Date()
      };

      // Update status
      this.processingQueue.set(processingId, { 
        status: 'processing',
        progress: 0
      });

      // Read file content
      const content = await this.readFileContent(file);
      
      // Store raw content
      await window.fs.writeFile(file.name, content);

      // Process content
      const extension = getFileExtension(file.name);
      if (!extension) throw new Error('Invalid file extension');

      if (isCodeFile(extension)) {
        await this.processCodeContent(
          content,
          document.id,
          projectId,
          file.name,
          (progress) => {
            this.updateProgress(processingId, progress);
            if (onProgress) onProgress(progress);
          }
        );
      } else {
        await this.processTextContent(
          content,
          document.id,
          projectId,
          file.name,
          (progress) => {
            this.updateProgress(processingId, progress);
            if (onProgress) onProgress(progress);
          }
        );
      }

      // Mark as completed
      this.processingQueue.set(processingId, {
        status: 'completed',
        progress: 100
      });

      return document;

    } catch (error) {
      // Handle error
      this.processingQueue.set(processingId, {
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Cleanup
      try {
        await window.fs.unlink(file.name);
      } catch (e) {
        console.error('Error cleaning up file:', e);
      }
      
      throw error;
    } finally {
      // Remove from queue after delay
      setTimeout(() => {
        this.processingQueue.delete(processingId);
      }, 5000);
    }
  }

  private updateProgress(id: string, progress: number) {
    const current = this.processingQueue.get(id);
    if (current) {
      this.processingQueue.set(id, {
        ...current,
        progress: Math.min(Math.round(progress), 100)
      });
    }
  }

  private async processTextContent(
    content: string,
    documentId: string,
    projectId: string,
    fileName: string,
    onProgress: (progress: number) => void
  ): Promise<void> {
    const chunks = this.createTextChunks(content);
    const totalChunks = chunks.length;
    let processedChunks = 0;

    // Process in batches
    for (let i = 0; i < chunks.length; i += this.BATCH_SIZE) {
      const batch = chunks.slice(i, Math.min(i + this.BATCH_SIZE, chunks.length));
      
      // Generate embeddings for batch
      const embeddings = await embeddingsService.generateBatchEmbeddings(batch);
      
      // Store vectors
      await Promise.all(embeddings.map((embedding, index) => 
        improvedVectorStore.addVector({
          id: uuidv4(),
          vector: embedding,
          metadata: {
            documentId,
            projectId,
            fileName,
            chunkIndex: i + index,
            contentType: 'text'
          }
        })
      ));

      processedChunks += batch.length;
      onProgress((processedChunks / totalChunks) * 100);
      
      // Small delay to prevent UI freezing
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private async processCodeContent(
    content: string,
    documentId: string,
    projectId: string,
    fileName: string,
    onProgress: (progress: number) => void
  ): Promise<void> {
    const lines = content.split('\n');
    const chunks = [];
    
    for (let i = 0; i < lines.length; i += this.CODE_CHUNK_SIZE) {
      const chunk = lines.slice(i, i + this.CODE_CHUNK_SIZE).join('\n');
      chunks.push({
        content: chunk,
        startLine: i + 1,
        endLine: Math.min(i + this.CODE_CHUNK_SIZE, lines.length)
      });
    }

    let processedChunks = 0;
    const totalChunks = chunks.length;

    // Process in batches
    for (let i = 0; i < chunks.length; i += this.BATCH_SIZE) {
      const batch = chunks.slice(i, Math.min(i + this.BATCH_SIZE, chunks.length));
      
      // Generate embeddings for batch
      const embeddings = await embeddingsService.generateBatchEmbeddings(
        batch.map(chunk => chunk.content)
      );
      
      // Store vectors
      await Promise.all(embeddings.map((embedding, index) => 
        improvedVectorStore.addVector({
          id: uuidv4(),
          vector: embedding,
          metadata: {
            documentId,
            projectId,
            fileName,
            startLine: batch[index].startLine,
            endLine: batch[index].endLine,
            contentType: 'code'
          }
        })
      ));

      processedChunks += batch.length;
      onProgress((processedChunks / totalChunks) * 100);
      
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  // Helper methods...
  private createTextChunks(text: string): string[] {
    const chunks: string[] = [];
    let currentIndex = 0;
    
    while (currentIndex < text.length) {
      const chunk = text.slice(
        currentIndex,
        Math.min(currentIndex + this.CHUNK_SIZE, text.length)
      );
      chunks.push(chunk);
      currentIndex += this.CHUNK_SIZE;
    }
    
    return chunks;
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  private validateFile(file: File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize && !!getFileExtension(file.name);
  }

  // Public methods for status checking
  getProcessingStatus(processingId: string): ProcessingStatus | undefined {
    return this.processingQueue.get(processingId);
  }

  isProcessing(processingId: string): boolean {
    const status = this.processingQueue.get(processingId);
    return status?.status === 'processing';
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      // Delete vectors associated with the document
      await improvedVectorStore.deleteDocumentVectors(documentId);
      
      // Find document in projects to get filename
      const documentInfo = projectStore.findDocumentInProjects(documentId);
      if (!documentInfo) {
        throw new Error('Document not found');
      }

      // Delete the file content
      try {
        await window.fs.unlink(documentInfo.document.name);
      } catch (error) {
        console.error('Error deleting file content:', error);
      }
      
      // The project store will handle removing the document from the project
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
}

export const improvedDocumentService = new ImprovedDocumentService();