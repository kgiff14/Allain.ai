# Allain - Privacy-First Local RAG Chat Application

Allain is a sophisticated local Retrieval-Augmented Generation (RAG) chat application that provides a Claude-like interface while ensuring complete privacy by processing all documents and embeddings locally. It leverages Anthropic's Claude API for language model capabilities while maintaining full privacy for your documents.

## Key Features

- 🔒 **Complete Privacy**
  - All document processing and embeddings remain local
  - No document data ever leaves your machine
  - Only chat messages are sent to Anthropic's API
  - Local vector storage using IndexedDB

- 🤖 **Advanced Model Support**
  - Claude 3.5 Sonnet - Best for complex tasks and analysis
  - Claude 3.5 Haiku - Fast and efficient for simple tasks
  - Configurable system messages and parameters
  - Support for image input (Sonnet model)

- 📑 **Document Management**
  - Upload and manage multiple document types
  - Built-in document viewer
  - Real-time document processing
  - Efficient document chunking and local vector search
  - Support for code files with syntax highlighting

- 💬 **Chat Interface**
  - Clean, Claude-like interface
  - Real-time message streaming
  - Rich Markdown support with syntax highlighting
  - Support for image attachments and previews
  - Chat history management
  - Customizable model configurations

- 🛠️ **Technical Features**
  - Local embeddings using TensorFlow.js
  - IndexedDB for document and vector storage
  - Real-time streaming responses
  - Configurable chunking strategies for different file types
  - Project knowledge sidebar with document management

## Tech Stack

- **Frontend**:
  - React with TypeScript
  - TailwindCSS for styling
  - Lucide icons
  - React Router for navigation

- **Data Processing**:
  - TensorFlow.js for local embeddings
  - IndexedDB for persistent storage
  - Local file system API for document management

- **API Integration**:
  - Anthropic Claude API for chat
  - Express.js backend for API proxy
  - Server-Sent Events for streaming

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Anthropic API key
- Modern web browser with IndexedDB support

## Installation

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

## Development

Start the development server:

```bash
# Start the backend
npm run server

# In a new terminal, start the frontend
npm run start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Features in Detail

### Local Document Processing
- Documents are processed entirely on your machine
- TensorFlow.js handles embeddings generation
- Efficient chunking strategies for different file types
- Vector storage in IndexedDB for persistent retrieval

### Chat Interface
- Clean, modern design similar to Claude
- Real-time message streaming
- Support for image uploads and previews
- Markdown rendering with code syntax highlighting
- Customizable model settings

### Document Management
- Drag-and-drop file uploads
- Built-in document viewer
- Real-time document processing
- Support for multiple file types
- Document deletion and management

### Privacy Features
- No external API calls except for chat
- All document processing happens locally
- Embeddings generated and stored on your machine
- No tracking or analytics

### Model Configuration
- Adjustable parameters:
  - Temperature
  - Max tokens
  - System messages
- Model selection between Sonnet and Haiku
- Persistent configuration storage

## Project Structure

```
allain/
├── src/
│   ├── components/        # React components
│   │   ├── chat/         # Chat-related components
│   │   └── ui/          # Reusable UI components
│   ├── services/         # Core services
│   │   ├── enhancedChatService.ts
│   │   ├── localEmbeddingsService.ts
│   │   └── vectorStoreService.ts
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript definitions
│   └── utils/           # Utility functions
├── server/              # Express backend
└── public/             # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for the Claude API
- [TensorFlow.js](https://www.tensorflow.org/js) team
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React](https://reactjs.org/) team
