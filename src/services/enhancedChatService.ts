import { Message } from '../types';
import { Model } from '../components/chat/ModelSelector';

export type MessageContent = {
  type: 'text';
  text: string;
} | {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
};

interface ModelConfig {
  maxTokens: number;
  temperature: number;
  systemMessage: string;
}

class EnhancedChatService {
  private timeout: number;
  private baseUrl: string;
  private decoder: TextDecoder;

  constructor(options: { timeout?: number } = {}) {
    this.timeout = options.timeout || 120000;
    this.baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001' 
      : '/api';
    this.decoder = new TextDecoder();
  }

  private getModelConfig(): ModelConfig {
    const defaultConfig = {
      maxTokens: 4096,
      temperature: 0.7,
      systemMessage: "You are Claude, an AI assistant focused on being helpful, harmless, and honest."
    };

    const savedConfig = localStorage.getItem('modelConfig');
    return savedConfig ? JSON.parse(savedConfig) : defaultConfig;
  }

  private async* streamResponse(response: Response): AsyncGenerator<string, void, unknown> {
    if (!response.body) throw new Error('No response body available');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === 'content_block_delta' && 
                  event.delta?.type === 'text_delta' && 
                  event.delta.text) {
                yield event.delta.text;
              }
            } catch (e) {
              console.warn('Failed to parse event:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Helper to convert image to base64
  private async convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Extract the base64 data without the data URL prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Helper to prepare message content with images and RAG context
  private async prepareMessageContent(
    textContent: string, 
    ragContext: string, 
    images?: File[],
    supportsImages: boolean = false
  ): Promise<MessageContent[]> {
    const messageContent: MessageContent[] = [];

    // Add images if supported and provided
    if (supportsImages && images && images.length > 0) {
      const imageContents = await Promise.all(
        images.map(async file => ({
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: file.type,
            data: await this.convertImageToBase64(file)
          }
        }))
      );
      messageContent.push(...imageContents);
    }

    // Add text content with RAG context
    messageContent.push({
      type: 'text',
      text: `${ragContext ? ragContext + '\n\n' : ''}${textContent}`
    });

    return messageContent;
  }

  async streamMessage(
    content: string,
    messageHistory: Message[] = [],
    onChunk: (chunk: string) => void,
    model: Model,
    ragContext?: string,
    images?: File[]
  ): Promise<Message> {
    const config = this.getModelConfig();
    
    // Format message history without system message
    const formattedMessages = messageHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Prepare message content with both images and RAG context
    const messageContent = await this.prepareMessageContent(
      content,
      ragContext || '',
      images,
      model.capabilities.imageInput
    );

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.apiId,
        system: config.systemMessage,
        messages: [
          ...formattedMessages,
          {
            role: 'user',
            content: messageContent
          }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let fullContent = '';
    const messageId = Date.now().toString();

    try {
      for await (const chunk of this.streamResponse(response)) {
        fullContent += chunk;
        onChunk(chunk);
      }
    } catch (error) {
      console.error('Error in stream processing:', error);
      throw error;
    }

    return {
      id: messageId,
      content: fullContent,
      role: 'assistant',
      timestamp: new Date()
    };
  }
}

export const enhancedChatService = new EnhancedChatService({
  timeout: 120000
});