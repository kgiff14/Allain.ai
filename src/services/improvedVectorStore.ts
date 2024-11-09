// services/improvedVectorStore.ts
import { Vector, VectorMetadata } from "../types/types";

// HNSW Graph Node structure
interface HNSWNode {
  id: string;
  vector: number[];
  metadata: VectorMetadata;
  connections: Map<number, Set<string>>; // level -> neighbor ids
}

class ImprovedVectorStore {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'VectorStoreDB';
  private readonly STORE_NAME = 'vectors';
  private readonly BATCH_SIZE = 50;
  
  // HNSW parameters
  private readonly MAX_LEVEL = 4;
  private readonly NEIGHBORS_PER_LEVEL = 8;
  private graph: Map<string, HNSWNode> = new Map();
  private entryPoints: string[] = [];

  async init() {
    if (this.db) return;
    await this.initDatabase();
    await this.loadGraphFromDB();
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
          store.createIndex('projectId', 'metadata.projectId', { unique: false });
          store.createIndex('documentId', 'metadata.documentId', { unique: false });
        }
      };
    });
  }

  private async loadGraphFromDB(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const vectors = request.result;
        this.buildHNSWGraph(vectors);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  private buildHNSWGraph(vectors: Vector[]): void {
    this.graph.clear();
    this.entryPoints = [];

    // Create nodes for all vectors
    for (const vector of vectors) {
      const level = this.getRandomLevel();
      const node: HNSWNode = {
        id: vector.id,
        vector: vector.vector,
        metadata: vector.metadata,
        connections: new Map()
      };
      
      // Initialize connections for each level
      for (let l = 0; l <= level; l++) {
        node.connections.set(l, new Set());
      }

      this.graph.set(vector.id, node);
      
      // Update entry points if needed
      if (level > (this.entryPoints.length - 1)) {
        this.entryPoints.push(vector.id);
      }
    }

    // Build connections
    for (const node of this.graph.values()) {
      this.connectNode(node);
    }
  }

  private getRandomLevel(): number {
    // Implement level generation with exponential distribution
    return Math.min(
      -Math.floor(
        Math.log(Math.random()) / Math.log(this.NEIGHBORS_PER_LEVEL)
      ),
      this.MAX_LEVEL
    );
  }

  private connectNode(node: HNSWNode): void {
    // For each level the node exists in
    for (let level = 0; level < node.connections.size; level++) {
      // Find nearest neighbors at this level
      const neighbors = this.findNearestNeighbors(
        node.vector,
        this.NEIGHBORS_PER_LEVEL,
        level,
        new Set([node.id])
      );

      // Add bidirectional connections
      const connections = node.connections.get(level)!;
      for (const neighborId of neighbors) {
        connections.add(neighborId);
        const neighbor = this.graph.get(neighborId)!;
        neighbor.connections.get(level)?.add(node.id);
      }
    }
  }

  private findNearestNeighbors(
    queryVector: number[],
    k: number,
    level: number,
    excluded: Set<string>
  ): string[] {
    const candidates = new Set<string>();
    const visited = new Set<string>();

    // Start from entry points
    let currentBest = this.entryPoints[Math.min(level, this.entryPoints.length - 1)];
    candidates.add(currentBest);

    while (candidates.size > 0) {
      // Get the closest unvisited candidate
      currentBest = this.getClosestCandidate(queryVector, candidates, visited);
      visited.add(currentBest);

      // Add neighbors to candidates
      const node = this.graph.get(currentBest)!;
      const connections = node.connections.get(level) || new Set();
      for (const neighborId of connections) {
        if (!visited.has(neighborId) && !excluded.has(neighborId)) {
          candidates.add(neighborId);
        }
      }
    }

    // Return k nearest from visited nodes
    return Array.from(visited)
      .map(id => ({
        id,
        similarity: this.cosineSimilarity(queryVector, this.graph.get(id)!.vector)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k)
      .map(result => result.id);
  }

  private getClosestCandidate(
    queryVector: number[],
    candidates: Set<string>,
    visited: Set<string>
  ): string {
    let bestSimilarity = -1;
    let bestId = Array.from(candidates)[0];

    for (const id of candidates) {
      if (visited.has(id)) continue;
      const similarity = this.cosineSimilarity(
        queryVector,
        this.graph.get(id)!.vector
      );
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestId = id;
      }
    }

    candidates.delete(bestId);
    return bestId;
  }

  async findSimilarVectors(
    queryVector: number[],
    projectIds: string[],
    limit: number = 5
  ): Promise<Vector[]> {
    if (!this.db) throw new Error('Database not initialized');

    // Use HNSW to find candidate vectors
    const candidates = this.findNearestNeighbors(
      queryVector,
      limit * 2, // Get more candidates than needed to filter by project
      0,
      new Set()
    );

    // Filter and rank candidates
    const results = candidates
      .map(id => {
        const node = this.graph.get(id)!;
        return {
          id: node.id,
          vector: node.vector,
          metadata: node.metadata,
          similarity: this.cosineSimilarity(queryVector, node.vector)
        };
      })
      .filter(vector => projectIds.includes(vector.metadata.projectId))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return results;
  }

  // Batch vector addition with transaction management
  private subscribers: Set<() => void> = new Set();
  // Add subscription mechanism
  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  async addVector(vector: Vector): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const request = store.add(vector);
      request.onsuccess = () => {
        // Update the HNSW graph immediately
        const node: HNSWNode = {
          id: vector.id,
          vector: vector.vector,
          metadata: vector.metadata,
          connections: new Map()
        };
        
        const level = this.getRandomLevel();
        for (let l = 0; l <= level; l++) {
          node.connections.set(l, new Set());
        }
        
        this.graph.set(vector.id, node);
        this.connectNode(node);
        
        this.notifySubscribers();
        resolve();
      };
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

  async clearAllVectors(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
  
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log('Vector store contents cleared successfully');
        resolve();
      };
      
      request.onerror = () => {
        console.error('Error clearing vector store:', request.error);
        reject(request.error);
      };

      this.notifySubscribers();
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
      
      this.notifySubscribers();
    });
  }
}

export const improvedVectorStore = new ImprovedVectorStore();