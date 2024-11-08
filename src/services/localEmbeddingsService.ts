// services/localEmbeddingsService.ts
import * as tf from '@tensorflow/tfjs';
import { load } from '@tensorflow-models/universal-sentence-encoder';

const MAX_SEQUENCE_LENGTH = 512; // Maximum length for USE model

class LocalEmbeddingsService {
  private model: any = null;
  private cache: Map<string, number[]>;
  private modelLoading: Promise<void> | null = null;

  constructor() {
    this.cache = new Map();
    this.loadModel();
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

  public async generateEmbedding(text: string): Promise<number[]> {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text provided for embedding generation');
    }

    const cacheKey = text;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      if (!this.model) {
        await this.loadModel();
      }

      const processedText = this.truncateText(text.trim());
      const embeddings = await this.model.embed([processedText]);
      const embeddingData = await embeddings.data();
      const embedding = Array.from(embeddingData as Float32Array);
      embeddings.dispose();

      this.cache.set(cacheKey, embedding);

      if (this.cache.size > 1000) {
        const firstKey = this.cache.keys().next().value as string;
        this.cache.delete(firstKey);
      }

      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    } finally {
      tf.dispose();
    }
  }

  public async generateQueryEmbedding(query: string): Promise<number[]> {
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query provided for embedding generation');
    }
    return this.generateEmbedding(query);
  }

  public async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (!Array.isArray(texts) || !texts.length) {
      return [];
    }

    try {
      if (!this.model) {
        await this.loadModel();
      }

      const BATCH_SIZE = 5;
      const embeddings: number[][] = [];

      for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE).map(text => {
          if (!text || typeof text !== 'string') {
            throw new Error('Invalid text in batch');
          }
          return this.truncateText(text.trim());
        });
        
        const batchEmbeddings = await this.model.embed(batch);
        const batchData = await batchEmbeddings.data();
        const embedDim = (batchData as Float32Array).length / batch.length;
        
        for (let j = 0; j < batch.length; j++) {
          const start = j * embedDim;
          const end = start + embedDim;
          embeddings.push(Array.from(batchData.slice(start, end) as Float32Array));
        }

        batchEmbeddings.dispose();
      }

      return embeddings;
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw error;
    } finally {
      tf.dispose();
    }
  }

  public clearCache() {
    this.cache.clear();
  }
}

export const embeddingsService = new LocalEmbeddingsService();