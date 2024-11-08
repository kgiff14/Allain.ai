// services/vectorStoreService.ts
interface VectorMetadata {
  fileName: string;
  projectId: string;
  documentId: string;
  startIndex?: number;
  endIndex?: number;
  startLine?: number;
  endLine?: number;
  [key: string]: any;
}

interface VectorEntry {
  id: string;
  vector: number[];
  metadata: VectorMetadata;
  similarity?: number;
}

interface SearchOptions {
  limit?: number;
  filter?: {
    [K in keyof VectorMetadata]?: FilterCondition;
  };
}

interface FilterCondition {
  $in?: string[];
  $eq?: string;
}

class VectorStoreService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'VectorStoreDB';
  private readonly STORE_NAME = 'vectors';
  private readonly DB_VERSION = 2;

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
          store.createIndex('projectId', 'metadata.projectId', { unique: false });
          store.createIndex('documentId', 'metadata.documentId', { unique: false });
          store.createIndex('fileName', 'metadata.fileName', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<void> {
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

  async addVectorsBatch(entries: VectorEntry[]): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      let completed = 0;
      let failed = false;

      entries.forEach(entry => {
        const request = store.put(entry);
        
        request.onerror = () => {
          failed = true;
          reject(request.error);
        };
        
        request.onsuccess = () => {
          completed++;
          if (completed === entries.length && !failed) {
            resolve();
          }
        };
      });

      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getVectorsByMetadata(query: Partial<VectorMetadata>, limit?: number): Promise<VectorEntry[]> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        let results = request.result.filter(entry => {
          return Object.entries(query).every(([key, value]) => 
            entry.metadata[key] === value
          );
        });

        if (limit) {
          results = results.slice(0, limit);
        }

        resolve(results);
      };
    });
  }

  async findSimilarVectors(queryVector: number[], options: SearchOptions = {}): Promise<VectorEntry[]> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      
      // Use cursor for memory efficiency
      const vectors: VectorEntry[] = [];
      const request = store.openCursor();

      request.onerror = () => reject(request.error);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          const vector = cursor.value as VectorEntry;
          
          // Apply filters if provided
          let includeVector = true;
          if (options.filter) {
            includeVector = Object.entries(options.filter).every(([key, condition]) => {
              if (!condition) return true;
              
              if (condition.$in && condition.$in.length > 0) {
                return condition.$in.includes(vector.metadata[key]);
              }
              if (condition.$eq !== undefined) {
                return vector.metadata[key] === condition.$eq;
              }
              return true;
            });
          }

          if (includeVector) {
            // Calculate similarity
            const similarity = this.cosineSimilarity(queryVector, vector.vector);
            vectors.push({ ...vector, similarity });
          }

          cursor.continue();
        } else {
          // Sort by similarity and apply limit
          vectors.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
          
          if (options.limit) {
            vectors.length = Math.min(vectors.length, options.limit);
          }

          resolve(vectors);
        }
      };
    });
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async deleteVector(id: string): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteVectorsByMetadata(metadata: Partial<VectorMetadata>): Promise<void> {
    const vectors = await this.getVectorsByMetadata(metadata);
    
    // Delete in batches to manage memory
    const BATCH_SIZE = 50;
    for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
      const batch = vectors.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(vector => this.deleteVector(vector.id)));
    }
  }
}

export const vectorStore = new VectorStoreService();