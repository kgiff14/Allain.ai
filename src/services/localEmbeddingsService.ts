// services/localEmbeddingsService.ts
import * as tf from '@tensorflow/tfjs';
import { load } from '@tensorflow-models/universal-sentence-encoder';

const MAX_SEQUENCE_LENGTH = 512;
const WORKER_BATCH_THRESHOLD = 10; // Minimum batch size to use worker
const MAX_PARALLEL_BATCHES = 3;    // Maximum number of parallel worker batches


class LocalEmbeddingsService {
  private model: any = null;
  private cache: Map<string, number[]>;
  private modelLoading: Promise<void> | null = null;
  private worker: Worker | null = null;
  private workerReady: boolean = false;
  private pendingBatches: Map<string, {
    resolve: (value: number[][]) => void;
    reject: (reason: any) => void;
  }> = new Map();

  constructor() {
    this.cache = new Map();
    this.initWorker();
    this.loadModel();
  }

  private initWorker() {
    // Check if we're in a browser environment that supports web workers
    if (typeof window === 'undefined' || !window.Worker) {
      console.warn('Web Workers not supported - falling back to main thread processing');
      return;
    }

    try {
      // Create a worker using inline code
      const workerCode = `
        let model = null;
        const MAX_SEQUENCE_LENGTH = 512;

        // Load TensorFlow.js and USE from CDN
        self.importScripts(
          'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js',
          'https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder'
        );

        async function initializeModel() {
          if (!model) {
            try {
              await tf.setBackend('webgl');
            } catch {
              await tf.setBackend('cpu');
            }
            await tf.ready();
            model = await use.load();
          }
        }

        function truncateText(text) {
          const words = text.split(' ');
          return words.length > MAX_SEQUENCE_LENGTH 
            ? words.slice(0, MAX_SEQUENCE_LENGTH).join(' ') 
            : text;
        }

        async function generateEmbeddings(texts) {
          await initializeModel();
          const processedTexts = texts.map(text => truncateText(text.trim()));
          const embeddings = await model.embed(processedTexts);
          const embeddingData = await embeddings.data();
          const embedDim = embeddingData.length / texts.length;
          const result = [];
          
          for (let i = 0; i < texts.length; i++) {
            const start = i * embedDim;
            const end = start + embedDim;
            result.push(Array.from(embeddingData.slice(start, end)));
          }
          
          embeddings.dispose();
          return result;
        }

        self.onmessage = async (e) => {
          try {
            const { texts, batchId } = e.data;
            const embeddings = await generateEmbeddings(texts);
            self.postMessage({ embeddings, batchId, error: null });
          } catch (error) {
            self.postMessage({ 
              embeddings: null, 
              batchId: e.data.batchId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          } finally {
            if (self.tf) self.tf.dispose();
          }
        };

        self.postMessage({ type: 'ready' });
      `;

      // Create a blob from the worker code
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);
      
      // Clean up the URL once the worker is created
      URL.revokeObjectURL(workerUrl);

      this.worker.onmessage = (e) => {
        if (e.data.type === 'ready') {
          console.log('Embedding worker initialized successfully');
          this.workerReady = true;
          return;
        }

        const { embeddings, batchId, error } = e.data;
        const pending = this.pendingBatches.get(batchId);
        
        if (pending) {
          if (error) {
            pending.reject(new Error(error));
          } else {
            pending.resolve(embeddings);
          }
          this.pendingBatches.delete(batchId);
        }
      };

      this.worker.onerror = (error) => {
        console.error('Embedding worker error:', error);
        this.workerReady = false;
        this.worker = null;
      };
    } catch (error) {
      console.error('Failed to initialize embedding worker:', error);
      this.worker = null;
    }
  }

  private async loadModel(): Promise<void> {
    if (!this.modelLoading) {
      this.modelLoading = (async () => {
        try {
          try {
            await tf.setBackend('webgl');
          } catch {
            await tf.setBackend('cpu');
          }
          await tf.ready();
          this.model = await load();
          console.log('Universal Sentence Encoder model loaded successfully');
          console.log('Using backend:', tf.getBackend());
        } catch (error) {
          console.error('Error loading USE model:', error);
          throw error;
        }
      })();
    }
    return this.modelLoading;
  }

  private truncateText(text: string): string {
    const words = text.split(' ');
    if (words.length > MAX_SEQUENCE_LENGTH) {
      return words.slice(0, MAX_SEQUENCE_LENGTH).join(' ');
    }
    return text;
  }

  private async processInMainThread(texts: string[]): Promise<number[][]> {
    if (!this.model) {
      await this.loadModel();
    }

    const processedTexts = texts.map(text => this.truncateText(text.trim()));
    const embeddings = await this.model.embed(processedTexts);
    const embeddingData = await embeddings.data();
    const embedDim = embeddingData.length / texts.length;
    const result: number[][] = [];

    for (let i = 0; i < texts.length; i++) {
      const start = i * embedDim;
      const end = start + embedDim;
      result.push(Array.from(embeddingData.slice(start, end)));
    }

    embeddings.dispose();
    return result;
  }

  private processInWorker(texts: string[]): Promise<number[][]> {
    return new Promise((resolve, reject) => {
      if (!this.worker || !this.workerReady) {
        return this.processInMainThread(texts).then(resolve).catch(reject);
      }

      const batchId = Date.now().toString();
      this.pendingBatches.set(batchId, { resolve, reject });
      this.worker.postMessage({ texts, batchId });
    });
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text provided for embedding generation');
    }

    const cacheKey = text;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const [embedding] = await this.generateBatchEmbeddings([text]);
    this.cache.set(cacheKey, embedding);

    if (this.cache.size > 1000) {
      this.cache.delete(this.cache.keys().next().value as string);
    }

    return embedding;
  }

  public async generateQueryEmbedding(query: string): Promise<number[]> {
    return this.generateEmbedding(query);
  }

  public async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];

    // For small batches or when worker isn't available, use main thread
    if (texts.length < WORKER_BATCH_THRESHOLD || !this.worker || !this.workerReady) {
      return this.processInMainThread(texts);
    }

    // Split into smaller batches for parallel processing
    const batchSize = Math.ceil(texts.length / MAX_PARALLEL_BATCHES);
    const batches: string[][] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }

    // Process batches in parallel
    const results = await Promise.all(
      batches.map(batch => this.processInWorker(batch))
    );

    // Combine results
    return results.flat();
  }

  public clearCache() {
    this.cache.clear();
  }

  // Clean up resources when service is destroyed
  public destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.clearCache();
    if (this.model) {
      tf.dispose();
      this.model = null;
    }
  }
}

export const embeddingsService = new LocalEmbeddingsService();