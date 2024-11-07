// services/vectorStoreService.ts
interface VectorEntry {
    id: string;
    vector: number[];
    metadata: {
      documentId: string;
      fileName: string;
      chunk: string;
      startLine?: number;
      endLine?: number;
    };
  }
  
  class VectorStoreService {
    private db: IDBDatabase | null = null;
    private readonly DB_NAME = 'VectorStoreDB';
    private readonly STORE_NAME = 'vectors';
    private readonly DB_VERSION = 1;
  
    constructor() {
      this.initDB();
    }
  
    private async initDB(): Promise<void> {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
  
        request.onerror = () => reject(request.error);
  
        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };
  
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          if (!db.objectStoreNames.contains(this.STORE_NAME)) {
            const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
            store.createIndex('documentId', 'metadata.documentId', { unique: false });
            store.createIndex('vector', 'vector', { unique: false });
          }
        };
      });
    }
  
    async ensureDB(): Promise<void> {
      if (!this.db) {
        await this.initDB();
      }
    }
  
    async addVector(entry: VectorEntry): Promise<void> {
      await this.ensureDB();
      if (!this.db) throw new Error('Database not initialized');
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(entry);
  
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  
    async deleteVectorsByDocumentId(documentId: string): Promise<void> {
      await this.ensureDB();
      if (!this.db) throw new Error('Database not initialized');
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const index = store.index('documentId');
        const request = index.openCursor(IDBKeyRange.only(documentId));
  
        request.onerror = () => reject(request.error);
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
      });
    }
  
    async findSimilarVectors(queryVector: number[], limit: number = 5): Promise<VectorEntry[]> {
      await this.ensureDB();
      if (!this.db) throw new Error('Database not initialized');
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.getAll();
  
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
          const vectors: VectorEntry[] = request.result;
          
          // Calculate cosine similarity for each vector
          const vectorsWithSimilarity = vectors.map(entry => ({
            ...entry,
            similarity: this.cosineSimilarity(queryVector, entry.vector)
          }));
  
          // Sort by similarity and return top k results
          const results = vectorsWithSimilarity
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
  
          resolve(results);
        };
      });
    }
  
    private cosineSimilarity(a: number[], b: number[]): number {
      const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      return dotProduct / (magnitudeA * magnitudeB);
    }
  }
  
  export const vectorStore = new VectorStoreService();