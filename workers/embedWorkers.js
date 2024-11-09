// embedWorker.ts
import * as tf from '@tensorflow/tfjs';
import { load } from '@tensorflow-models/universal-sentence-encoder';

let model = null;

const MAX_SEQUENCE_LENGTH = 512;

const initializeModel = async () => {
  if (!model) {
    try {
      await tf.setBackend('webgl');
    } catch {
      await tf.setBackend('cpu');
    }
    await tf.ready();
    model = await load();
  }
};

const truncateText = (text) => {
  const words = text.split(' ');
  if (words.length > MAX_SEQUENCE_LENGTH) {
    return words.slice(0, MAX_SEQUENCE_LENGTH).join(' ');
  }
  return text;
};

const generateEmbeddings = async (texts) => {
  await initializeModel();
  
  const processedTexts = texts.map(text => truncateText(text.trim()));
  const embeddings = await model.embed(processedTexts);
  const embeddingData = await embeddings.data();
  
  // Convert to regular array format
  const embedDim = embeddingData.length / texts.length;
  const result = [];
  
  for (let i = 0; i < texts.length; i++) {
    const start = i * embedDim;
    const end = start + embedDim;
    result.push(Array.from(embeddingData.slice(start, end)));
  }
  
  embeddings.dispose();
  return result;
};

// Handle messages from main thread
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
    tf.dispose();
  }
};

// Notify main thread that worker is ready
self.postMessage({ type: 'ready' });