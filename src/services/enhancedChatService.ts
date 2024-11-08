import { Message } from '../types/types';
import { Model } from '../components/chat/ModelSelector';
import { personaStore } from '../services/personaStore';
import { memoryService } from './memoryService';

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

interface StreamMessageOptions {
  content: string;
  messageHistory?: Message[];
  onChunk: (chunk: string) => void;
  onMemoryCreated?: (memoryId: string) => void;  // New callback
  model: Model;
  ragContext?: string;
  images?: File[];
}

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

  private getModelConfig(model: Model): ModelConfig {
    // Get the current persona configuration
    const currentPersona = personaStore.getSelectedPersona();
    
    return {
      maxTokens: currentPersona.maxTokens,
      temperature: currentPersona.temperature,
      systemMessage: currentPersona.systemMessage
    };
  }

  private async* streamResponse(response: Response): AsyncGenerator<string, void, unknown> {
    if (!response.body) throw new Error('No response body available');
    
    const reader = response.body.getReader();
    let buffer = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += this.decoder.decode(value, { stream: true });
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
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async prepareMessageContent(
    textContent: string, 
    ragContext: string, 
    images?: File[],
    supportsImages: boolean = false
  ): Promise<MessageContent[]> {
    const messageContent: MessageContent[] = [];

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

    messageContent.push({
      type: 'text',
      text: `${ragContext ? ragContext + '\n\n' : ''}${textContent}`
    });

    return messageContent;
  }

  async streamMessage({
    content,
    messageHistory = [],
    onChunk,
    onMemoryCreated,  // New parameter
    model,
    ragContext,
    images
  }: StreamMessageOptions): Promise<Message> {
    const config = this.getModelConfig(model);
    const currentPersona = personaStore.getSelectedPersona();
    
    // Start memory processing early but don't await it yet
    const messageId = Date.now().toString();
    const memoryPromise = currentPersona.memoryConfig?.collectMemories 
      ? memoryService.processMessageForMemories(
          { id: messageId, content, role: 'user', timestamp: new Date() },
          currentPersona.id
        ).then(memoryContent => {
          // Notify UI about memory creation if callback provided
          if (memoryContent && onMemoryCreated) {
            const memoryId = Date.now().toString();
            onMemoryCreated(memoryId);
          }
          return memoryContent;
        })
      : Promise.resolve(null);

    // Get system prompt with memories
    const systemPromptWithMemories = memoryService.getSystemPromptWithMemories(
      config.systemMessage,
      currentPersona
    );
    
    // Format message history without system message
    const formattedMessages = messageHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

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
        system: systemPromptWithMemories,
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

    try {
      for await (const chunk of this.streamResponse(response)) {
        fullContent += chunk;
        onChunk(chunk);
      }

      // Create message with explicitly typed role
      const message: Message = {
        id: messageId,
        content: fullContent,
        role: 'assistant' as const, // Explicitly type the role
        timestamp: new Date(),
        persona: {
          id: currentPersona.id,
          name: currentPersona.name
        },
        model: {
          name: model.name,
          id: model.id
        }
      };

      // Now we can await the memory processing
      await memoryPromise;

      return message;
    } catch (error) {
      console.error('Error in stream processing:', error);
      throw error;
    }
  }
}

export const enhancedChatService = new EnhancedChatService({
  timeout: 120000
});