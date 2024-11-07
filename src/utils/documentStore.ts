// utils/documentStore.ts
import { ProjectDocument } from '../types';
import { embeddingsService } from '../services/localEmbeddingsService';
import { vectorStore } from '../services/vectorStoreService';

const DOCUMENTS_STORAGE_KEY = 'stored_documents';

interface StoredDocument extends ProjectDocument {
  content?: string;
}

export const documentStore = {
  // Add a new document
  addDocument: async (file: File): Promise<ProjectDocument> => {
    const documents = documentStore.getAllDocuments();
    
    // Read file content
    const content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });

    const newDocument: StoredDocument = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      uploadedAt: new Date(),
      content
    };

    // Store content using fs API
    await window.fs.writeFile(file.name, content);

    // Process document for embeddings
    await embeddingsService.processDocument(newDocument.id, file.name, content);

    // Store metadata in localStorage (without content)
    const { content: _, ...documentMetadata } = newDocument;
    localStorage.setItem(
      DOCUMENTS_STORAGE_KEY, 
      JSON.stringify([documentMetadata, ...documents])
    );

    return documentMetadata;
  },

  // Get all documents
  getAllDocuments: (): ProjectDocument[] => {
    const stored = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    if (!stored) return [];
    
    const documents: ProjectDocument[] = JSON.parse(stored);
    return documents.map(doc => ({
      ...doc,
      uploadedAt: new Date(doc.uploadedAt)
    }));
  },

  // Get a specific document
  getDocument: (documentId: string): ProjectDocument | null => {
    const documents = documentStore.getAllDocuments();
    const document = documents.find(doc => doc.id === documentId);
    return document ? {
      ...document,
      uploadedAt: new Date(document.uploadedAt)
    } : null;
  },

  // Delete a document
  deleteDocument: async (documentId: string): Promise<void> => {
    const documents = documentStore.getAllDocuments();
    const document = documents.find(doc => doc.id === documentId);
    
    if (document) {
      // Remove file content
      try {
        await window.fs.unlink(document.name);
        // Remove vectors from vector store
        await vectorStore.deleteVectorsByDocumentId(documentId);
      } catch (error) {
        console.error('Error deleting document content:', error);
      }
    }

    // Update localStorage
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(updatedDocuments));
  }
};