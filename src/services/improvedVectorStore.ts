// services/improvedVectorStore.ts

import { Vector, VectorMetadata } from "../types/types";

class ImprovedVectorStore {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'VectorStoreDB';
  private readonly STORE_NAME = 'vectors';
  private readonly BATCH_SIZE = 50;

  // Initialize with proper error handling and retry
  async init() {
    if (this.db) return;

    let retries = 3;
    while (retries > 0) {
      try {
        await this.initDatabase();
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 2);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          // Create indices for efficient querying
          store.createIndex('projectId', 'metadata.projectId', { unique: false });
          store.createIndex('documentId', 'metadata.documentId', { unique: false });
          store.createIndex('contentType', 'metadata.contentType', { unique: false });
        }
      };
    });
  }

  // Batch vector addition with transaction management
  // Single vector addition
async addVector(vector: Vector): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const request = store.add(vector);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Batch vector addition
  async addVectors(vectors: Vector[]) {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    // Process in batches to prevent transaction timeouts
    for (let i = 0; i < vectors.length; i += this.BATCH_SIZE) {
      const batch = vectors.slice(i, Math.min(i + this.BATCH_SIZE, vectors.length));
      await this.processBatch(batch);
    }
  }

  private async processBatch(vectors: Array<{ id: string; vector: number[]; metadata: VectorMetadata }>) {
    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      vectors.forEach(vector => {
        store.add(vector);
      });
    });
  }

  // Efficient similarity search with project filtering
  async findSimilarVectors(
    queryVector: number[],
    projectIds: string[],
    limit: number = 5
  ): Promise<Vector[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const projectIndex = store.index('projectId');

      const vectors: Array<{ id: string; vector: number[]; metadata: VectorMetadata; similarity: number }> = [];

      // Use cursor for memory efficiency
      const processNextBatch = () => {
        projectIndex.openCursor().onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          
          if (cursor) {
            const entry = cursor.value;
            if (projectIds.includes(entry.metadata.projectId)) {
              const similarity = this.cosineSimilarity(queryVector, entry.vector);
              vectors.push({
                ...entry,
                similarity
              });
            }
            cursor.continue();
          } else {
            // Sort by similarity and return top results
            vectors.sort((a, b) => b.similarity - a.similarity);
            resolve(vectors.slice(0, limit));
          }
        };
      };

      processNextBatch();
    });
  }

  // Efficient project cleanup
  async deleteProjectVectors(projectId: string) {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const projectIndex = store.index('projectId');

      const request = projectIndex.openKeyCursor(IDBKeyRange.only(projectId));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Delete all vectors for a specific document
  async deleteDocumentVectors(documentId: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const documentIndex = store.index('documentId');

      const request = documentIndex.openKeyCursor(IDBKeyRange.only(documentId));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const improvedVectorStore = new ImprovedVectorStore();