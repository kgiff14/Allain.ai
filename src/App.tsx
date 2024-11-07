import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ChatInputPage from './components/chat/ChatInputPage';
import ChatThreadPage from './components/chat/ChatThreadPage';
import { initializeServices } from './services/initServices';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeServices();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize services:', err);
        setError('Failed to initialize application services');
      }
    };

    init();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-red-400 text-center">
          <h1 className="text-xl font-semibold mb-2">Application Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-400 flex items-center gap-2">
          <Loader2 className="animate-spin" size={24} />
          <span>Initializing application...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ChatInputPage />} />
        <Route path="/response" element={<ChatThreadPage />} />
        <Route path="/chat/:chatId" element={<ChatThreadPage />} />
      </Routes>
    </Router>
  );
};

export default App;