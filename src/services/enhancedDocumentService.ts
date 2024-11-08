// services/enhancedDocumentService.ts
import { v4 as uuidv4 } from 'uuid';
import { ProjectDocument } from '../types/types';
import { getFileExtension, isCodeFile } from '../utils/fileTypes';

interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  similarity?: number;
  metadata: {
    pageNumber?: number;
    fileName: string;
    fileType: string;
    startIndex: number;
    endIndex: number;
    language?: string;
    lineNumbers?: {
      start: number;
      end: number;
    };
  };
}

class EnhancedDocumentService {
  private db: IDBDatabase | null = null;
  private CHUNK_SIZE = 1000;
  private CHUNK_OVERLAP = 200;
  private CODE_CHUNK_SIZE = 100; // Number of lines per code chunk

  constructor() {
    this.initDatabase();
  }

  private async initDatabase() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('AllainDB', 2);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('chunks')) {
          const chunkStore = db.createObjectStore('chunks', { keyPath: 'id' });
          chunkStore.createIndex('documentId', 'documentId', { unique: false });
          chunkStore.createIndex('embedding', 'embedding', { unique: false });
        }
      };
    });
  }

  async processDocument(file: File): Promise<ProjectDocument> {
    const extension = getFileExtension(file.name);
    if (!extension) {
      throw new Error(`Unsupported file type: ${file.name}`);
    }

    const text = await this.extractText(file);
    let chunks;

    if (isCodeFile(extension)) {
      chunks = this.createCodeChunks(text, extension);
    } else {
      chunks = this.createTextChunks(text);
    }

    const documentId = uuidv4();

    // Create embeddings for each chunk
    const documentChunks = await Promise.all(
      chunks.map(async chunk => ({
        id: uuidv4(),
        documentId,
        content: chunk.text,
        embedding: await this.createEmbedding(chunk.text),
        metadata: {
          fileName: file.name,
          fileType: extension,
          ...chunk.metadata
        }
      }))
    );

    // Store chunks in IndexedDB
    await this.saveChunks(documentChunks);

    // Create and return document metadata
    const document: ProjectDocument = {
      id: documentId,
      name: file.name,
      type: file.type,
      uploadedAt: new Date()
    };

    await this.saveDocument(document);
    return document;
  }

  private async extractText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  private createCodeChunks(code: string, fileType: string): Array<{
    text: string;
    metadata: {
      language: string;
      lineNumbers: {
        start: number;
        end: number;
      };
      startIndex: number;
      endIndex: number;
    };
  }> {
    const lines = code.split('\n');
    const chunks: Array<{
      text: string;
      metadata: {
        language: string;
        lineNumbers: {
          start: number;
          end: number;
        };
        startIndex: number;
        endIndex: number;
      };
    }> = [];

    // Remove file extension dot for language
    const language = fileType.substring(1);
    let currentChunk: string[] = [];
    let startLine = 1;
    let startIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      currentChunk.push(line);

      if (currentChunk.length >= this.CODE_CHUNK_SIZE || i === lines.length - 1) {
        const chunkText = currentChunk.join('\n');
        chunks.push({
          text: chunkText,
          metadata: {
            language,
            lineNumbers: {
              start: startLine,
              end: startLine + currentChunk.length - 1
            },
            startIndex,
            endIndex: startIndex + chunkText.length
          }
        });

        // Start new chunk with overlap
        const overlapLines = currentChunk.slice(-Math.floor(this.CODE_CHUNK_SIZE * 0.1));
        currentChunk = overlapLines;
        startLine = startLine + currentChunk.length - overlapLines.length;
        startIndex = startIndex + chunkText.length;
      }
    }

    return chunks;
  }

  private createTextChunks(text: string): Array<{
    text: string;
    metadata: {
      startIndex: number;
      endIndex: number;
    };
  }> {
    const chunks: Array<{
      text: string;
      metadata: {
        startIndex: number;
        endIndex: number;
      };
    }> = [];
    
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';
    let startIndex = 0;
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      
      if (currentChunk.length + paragraph.length > this.CHUNK_SIZE) {
        chunks.push({
          text: currentChunk,
          metadata: {
            startIndex,
            endIndex: startIndex + currentChunk.length
          }
        });
        
        // Start new chunk with overlap
        const lastChunkWords = currentChunk.split(' ').slice(-this.CHUNK_OVERLAP).join(' ');
        currentChunk = lastChunkWords + ' ' + paragraph;
        startIndex = startIndex + currentChunk.length - lastChunkWords.length;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + paragraph;
      }
    }
    
    if (currentChunk) {
      chunks.push({
        text: currentChunk,
        metadata: {
          startIndex,
          endIndex: startIndex + currentChunk.length
        }
      });
    }
    
    return chunks;
  }

  private async createEmbedding(text: string): Promise<number[]> {
    // For now, return a simple TF-IDF like representation
    // In production, you'd want to use a proper embedding model
    const words = text.toLowerCase().split(/\W+/);
    const wordFreq = new Map<string, number>();
    
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    return Array.from(wordFreq.values());
  }

  async findRelevantChunks(query: string): Promise<{
    content: string;
    metadata: {
      fileName: string;
      fileType: string;
      language?: string;
      lineNumbers?: {
        start: number;
        end: number;
      };
    };
  }[]> {
    const queryEmbedding = await this.createEmbedding(query);
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['chunks'], 'readonly');
      const store = transaction.objectStore('chunks');
      const chunks: DocumentChunk[] = [];

      store.openCursor().onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          const chunk = cursor.value as DocumentChunk;
          if (chunk.embedding) {
            const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
            chunks.push({ ...chunk, similarity });
          }
          cursor.continue();
        } else {
          resolve(
            chunks
              .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
              .slice(0, 5)
              .map(chunk => ({
                content: chunk.content,
                metadata: chunk.metadata
              }))
          );
        }
      };
    });
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));
    return dotProduct / (mag1 * mag2);
  }

  private async saveDocument(document: ProjectDocument): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      
      const request = store.add(document);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async saveChunks(chunks: DocumentChunk[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['chunks'], 'readwrite');
      const store = transaction.objectStore('chunks');
      
      chunks.forEach(chunk => store.add(chunk));
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const enhancedDocumentService = new EnhancedDocumentService();