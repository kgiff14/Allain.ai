// services/localEmbeddingsService.ts
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl'; // Import the backend
import { load } from '@tensorflow-models/universal-sentence-encoder';
import { vectorStore } from './vectorStoreService';
import { v4 as uuidv4 } from 'uuid';

async function initialize() {
    // Set backend and ensure it's ready before loading the model
    await tf.setBackend('webgl');
    await tf.ready();
  
    const model = await load();
    console.log('Model loaded successfully');
  }
  
initialize();

// Define chunk types for code and text
type TextChunk = { chunk: string };
type CodeChunk = { chunk: string; startLine: number; endLine: number };
type Chunk = TextChunk | CodeChunk;

// USE (Universal Sentence Encoder) is great for general text
// - Small size (~26MB)
// - Good performance
// - Multi-lingual support
// - Good accuracy for semantic search
class LocalEmbeddingsService {
  private model: any = null;
  private cache: Map<string, number[]>;
  private modelLoading: Promise<void> | null = null;

  constructor() {
    this.cache = new Map();
    // Initialize model loading
    this.loadModel();
  }

  private async loadModel(): Promise<void> {
    if (!this.modelLoading) {
      this.modelLoading = (async () => {
        try {
          // Load the Universal Sentence Encoder model
          this.model = await load();
          console.log('Universal Sentence Encoder model loaded');
        } catch (error) {
          console.error('Error loading USE model:', error);
          throw error;
        }
      })();
    }
    return this.modelLoading;
  }

  private async getEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = text;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
  
    try {
      // Ensure model is loaded
      if (!this.model) {
        await this.loadModel();
      }
  
      // Get embeddings
      const embeddings = await this.model.embed(text);
      const embedding = Array.from(await embeddings.data() as Float32Array) as number[];
      embeddings.dispose(); // Clean up tensor
  
      // Cache the result
      this.cache.set(cacheKey, embedding);
  
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }
  

  private splitCodeIntoChunks(code: string, chunkSize: number = 50): { chunk: string; startLine: number; endLine: number }[] {
    const lines = code.split('\n');
    const chunks = [];
    
    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunkLines = lines.slice(i, Math.min(i + chunkSize, lines.length));
      chunks.push({
        chunk: chunkLines.join('\n'),
        startLine: i + 1,
        endLine: Math.min(i + chunkSize, lines.length)
      });
    }
    
    return chunks;
  }

  private splitTextIntoChunks(text: string, maxChunkLength: number = 1000): string[] {
    const words = text.split(/\s+/);
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;

    for (const word of words) {
      if (currentLength + word.length > maxChunkLength && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
        currentLength = 0;
      }
      currentChunk.push(word);
      currentLength += word.length + 1; // +1 for space
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }

  async processDocument(documentId: string, fileName: string, content: string): Promise<void> {
    // Delete existing vectors for this document
    await vectorStore.deleteVectorsByDocumentId(documentId);
  
    // Determine chunking strategy based on file type
    const isCode = fileName.match(/\.(js|ts|py|java|cpp|cs|go|rb|php|swift|kt|rs)$/i);
    const chunks: Chunk[] = isCode
      ? this.splitCodeIntoChunks(content)
      : this.splitTextIntoChunks(content).map(chunk => ({ chunk }));
  
    // Process chunks in batches to avoid memory issues
    const BATCH_SIZE = 10;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      await Promise.all(batchChunks.map(async (chunk) => {
        const embedding = await this.getEmbedding(chunk.chunk);
  
        // Handle metadata depending on whether startLine and endLine exist
        const metadata: any = {
          documentId,
          fileName,
          chunk: chunk.chunk,
        };
  
        if ('startLine' in chunk && 'endLine' in chunk) {
          metadata.startLine = chunk.startLine;
          metadata.endLine = chunk.endLine;
        }
  
        await vectorStore.addVector({
          id: uuidv4(),
          vector: embedding,
          metadata
        });
      }));
    }
  }
  

  async findRelevantChunks(query: string, limit: number = 5) {
    const queryEmbedding = await this.getEmbedding(query);
    return vectorStore.findSimilarVectors(queryEmbedding, limit);
  }

  clearCache() {
    this.cache.clear();
  }
}

// Create and export singleton instance
export const embeddingsService = new LocalEmbeddingsService();