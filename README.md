# 🔍 Allain - Privacy-First Local RAG Chat Application

> Your personal AI assistant with local document processing and knowledge management

## 📚 Table of Contents
- [Overview](#overview)
- [Features](#features)
  - [Privacy & Security](#privacy--security)
  - [Document Processing](#document-processing)
  - [Chat Interface](#chat-interface)
  - [Memory System](#memory-system)
  - [Project Management](#project-management)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Technical Architecture](#technical-architecture)
- [Development](#development)

## 🌟 Overview

Allain is a sophisticated local Retrieval-Augmented Generation (RAG) chat application that combines the power of Claude's language models with complete privacy. It processes and stores all documents locally while providing a seamless chat experience enhanced with contextual knowledge from your documents.

## ✨ Features

### Privacy & Security
- 🔐 **100% Local Processing**: All document handling and embeddings are generated on your machine
- 🚫 **Zero Data Leakage**: No document data ever leaves your system
- 💾 **Local Storage**: Uses IndexedDB for document and vector storage
- 🤖 **API Security**: Only chat messages are sent to Anthropic's API

### Document Processing
- 📄 **Multiple File Types**: Support for code files, markdown, text, configurations
- 🔍 **Smart Chunking**: Adaptive document chunking based on content type
- 🧮 **Local Embeddings**: TensorFlow.js powered document embeddings
- 📊 **Vector Search**: Efficient similarity search for relevant context
- 🎨 **Syntax Highlighting**: Beautiful code rendering with support for multiple languages

### Chat Interface
- 💻 **Modern UI**: Clean, responsive interface with dark mode
- 🔄 **Real-time Streaming**: Instant response streaming
- 📸 **Image Support**: Upload and view images in chat (with Claude 3 Sonnet)
- 📝 **Rich Markdown**: Full markdown support with GFM
- 💭 **Context Window**: Shows active documents and context sources

### Memory System
- 🧠 **Conversation Memory**: Automatic memory collection and retrieval
- 📌 **Manual Memories**: Add important information manually
- 🎯 **Memory Management**: View, edit, and delete stored memories
- 🔄 **Context Integration**: Seamless memory integration in conversations

### Project Management
- 📂 **Project Organization**: Group documents into projects
- 🎚️ **Active/Inactive**: Toggle projects for RAG context
- 📊 **Storage Management**: Monitor and manage storage usage
- 🔄 **Batch Processing**: Efficient handling of multiple documents

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/allain.git
cd allain
```

2. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

3. Create a `.env` file:
```env
ANTHROPIC_API_KEY=your_api_key_here
```

## 🎯 Getting Started

1. Start the development server:
```bash
# Start backend
npm run server

# In a new terminal, start frontend
npm run start
```

2. Open your browser and navigate to:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

3. Create your first project and upload some documents to get started!

## 📖 Usage Guide

### Creating a Project
1. Click the project icon in the top right
2. Select "New Project"
3. Enter project details and toggle RAG if you want it active
4. Upload documents to your project

### Starting a Chat
1. Enter your message in the chat input
2. Select your preferred model (Sonnet or Haiku)
3. Add images if needed (Sonnet only)
4. Send your message and receive contextually-aware responses

### Managing Memories
1. Click the brain icon in the top bar
2. View automatically collected memories
3. Add manual memories if desired
4. Toggle memory collection and usage

### Using RAG Features
1. Enable projects you want to use for context
2. Ask questions about your documents
3. View source references in responses
4. Manage document context through the projects panel

## 🔧 Technical Architecture

```
allain/
├── src/
│   ├── components/        # React components
│   ├── services/         # Core services
│   │   ├── localEmbeddingsService.ts
│   │   ├── improvedVectorStore.ts
│   │   └── memoryService.ts
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript definitions
│   └── utils/           # Utility functions
├── server/              # Express backend
└── public/             # Static assets
```

### Key Technologies
- 🧠 TensorFlow.js for local embeddings
- 💾 IndexedDB for vector storage
- ⚛️ React + TypeScript
- 🎨 Tailwind CSS
- 🔄 Server-Sent Events for streaming
- 🤖 Claude API integration

## 👩‍💻 Development

### Building for Production
```bash
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.