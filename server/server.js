// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  // Create fetch controller for cleanup
  const controller = new AbortController();
  const { signal } = controller;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(req.body),
      signal
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return res.status(response.status).json({ error });
    }

    // Set response headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Create readable stream from response
    const stream = Readable.fromWeb(response.body);
    stream.pipe(res);

    // Handle client disconnect
    req.on('close', () => {
      controller.abort();
      stream.destroy();
    });

  } catch (error) {
    console.error('Server error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});