// services/documentContextService.ts
import { documentStore } from '../utils/documentStore';

interface DocumentChunk {
  content: string;
  metadata: {
    fileName: string;
    lineNumbers?: {
      start: number;
      end: number;
    };
  };
}

export const documentContextService = {
  async getRelevantContext(query: string): Promise<DocumentChunk[]> {
    const documents = documentStore.getAllDocuments();
    const relevantChunks: DocumentChunk[] = [];

    for (const doc of documents) {
      try {
        // Read the document content
        const content = await window.fs.readFile(doc.name, { encoding: 'utf8' });
        
        // Split into chunks by line for code files
        const lines = content.split('\n');
        const CHUNK_SIZE = 50; // Number of lines per chunk
        
        for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
          const chunkLines = lines.slice(i, i + CHUNK_SIZE);
          const chunkContent = chunkLines.join('\n');
          
          // Simple relevance check - look for query terms in the chunk
          // In a production environment, you'd want to use proper embeddings and similarity search
          const queryTerms = query.toLowerCase().split(' ');
          const isRelevant = queryTerms.some(term => 
            chunkContent.toLowerCase().includes(term)
          );
          
          if (isRelevant) {
            relevantChunks.push({
              content: chunkContent,
              metadata: {
                fileName: doc.name,
                lineNumbers: {
                  start: i + 1,
                  end: Math.min(i + CHUNK_SIZE, lines.length)
                }
              }
            });
          }
        }
      } catch (error) {
        console.error(`Error processing document ${doc.name}:`, error);
      }
    }

    // Sort chunks by relevance (in this case, just return the first few)
    return relevantChunks.slice(0, 5);
  }
};