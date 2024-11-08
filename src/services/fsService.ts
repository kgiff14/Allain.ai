// services/fsService.ts
class FileSystemService {
    private db: IDBDatabase | null = null;
    private readonly DB_NAME = 'FileSystemDB';
    private readonly STORE_NAME = 'files';
    private readonly DB_VERSION = 1;
  
    constructor() {
      this.initDB();
    }
  
    private initDB(): Promise<void> {
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
            db.createObjectStore(this.STORE_NAME);
          }
        };
      });
    }
  
    async ensureDB(): Promise<void> {
      if (!this.db) {
        await this.initDB();
      }
    }
  
    async readFile(path: string, options?: { encoding?: string }): Promise<string> {
      await this.ensureDB();
      if (!this.db) throw new Error('Database not initialized');
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(path);
  
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const content = request.result;
          if (content === undefined) {
            reject(new Error(`File not found: ${path}`));
          } else {
            resolve(content);
          }
        };
      });
    }

    async closeConnections(): Promise<void> {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
    }
  
    async writeFile(path: string, content: string): Promise<void> {
      await this.ensureDB();
      if (!this.db) throw new Error('Database not initialized');
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(content, path);
  
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  
    async unlink(path: string): Promise<void> {
      await this.ensureDB();
      if (!this.db) throw new Error('Database not initialized');
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.delete(path);
  
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }
  
  // Create and export a singleton instance
  export const fsService = new FileSystemService();
  
  // Initialize the window.fs API
  if (typeof window !== 'undefined') {
    window.fs = fsService;
  }