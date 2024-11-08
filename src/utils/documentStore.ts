// utils/documentStore.ts
import { ProjectDocument } from '../types/project';
import { projectStore } from '../services/projectStore';
import { documentProcessingService } from '../services/enhancedDocumentParsingService';

class DocumentStoreService {
  // Get all documents across all projects
  getAllDocuments(): ProjectDocument[] {
    return projectStore.getAllProjects()
      .flatMap(project => project.documents);
  }

  // Add a new document to a specific project
  async addDocument(file: File, projectId: string): Promise<ProjectDocument> {
    const project = projectStore.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    try {
      // Process document with the new service
      const document = await documentProcessingService.processDocument(file, projectId);
      
      // Add document to project
      projectStore.addDocumentToProject(projectId, document);

      return document;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  // Delete a document from its project
  async deleteDocument(documentId: string): Promise<void> {
    const documentInfo = projectStore.findDocumentInProjects(documentId);
    
    if (!documentInfo) {
      throw new Error('Document not found in any project');
    }

    const { projectId, document } = documentInfo;

    try {
      // Remove file content
      await window.fs.unlink(document.name);
      
      // Delete document vectors
      await documentProcessingService.deleteDocument(documentId);
      
      // Remove document from project
      projectStore.removeDocumentFromProject(projectId, documentId);
      
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Get a specific document's content
  async getDocumentContent(documentId: string): Promise<string | null> {
    const documentInfo = projectStore.findDocumentInProjects(documentId);
    
    if (!documentInfo) {
      return null;
    }

    try {
      const content = await window.fs.readFile(documentInfo.document.name, { encoding: 'utf8' });
      return content;
    } catch (error) {
      console.error('Error reading document content:', error);
      return null;
    }
  }

  // Check if a document exists in any project
  async documentExists(fileName: string): Promise<boolean> {
    const allProjects = projectStore.getAllProjects();
    return allProjects.some(project => 
      project.documents.some(doc => doc.name === fileName)
    );
  }
}

export const documentStore = new DocumentStoreService();