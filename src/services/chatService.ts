import OpenAI from 'openai';
import { ImageUtil } from '../utils/imageUtils.js';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  imageUrl?: string;
  localImageUrl?: string;
  filename?: string;
  responseId?: string; // OpenAI response ID for follow-up requests
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  lastResponseId?: string; // Track the last OpenAI response ID for multi-turn
}

const AI_MODEL = 'gpt-4.1-mini';

export class ChatService {
  private openai: OpenAI;
  private sessions: Map<string, ChatSession> = new Map();

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new chat session
   */
  createSession(requestId: string = 'unknown'): ChatSession {
    const sessionId = this.generateSessionId();
    const session: ChatSession = {
      id: sessionId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.sessions.set(sessionId, session);
    
    console.log(`[${requestId}] 💬 CHAT SERVICE: New session created - ${sessionId}`);
    
    return session;
  }

  /**
   * Get existing session or create new one
   */
  getOrCreateSession(sessionId?: string, requestId: string = 'unknown'): ChatSession {
    if (sessionId && this.sessions.has(sessionId)) {
      console.log(`[${requestId}] 💬 CHAT SERVICE: Retrieved existing session - ${sessionId}`);
      return this.sessions.get(sessionId)!;
    }
    
    console.log(`[${requestId}] 💬 CHAT SERVICE: Creating new session (${sessionId ? 'invalid ID provided' : 'no ID provided'})`);
    return this.createSession(requestId);
  }

  /**
   * Add message to session
   */
  private addMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string, imageData?: any): ChatMessage {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const message: ChatMessage = {
      id: this.generateMessageId(),
      role,
      content,
      timestamp: new Date().toISOString(),
      ...imageData
    };

    session.messages.push(message);
    session.updatedAt = new Date().toISOString();

    return message;
  }

  /**
   * Process chat message with OpenAI responses API for multi-turn image generation
   */
  async processMessage(
    sessionId: string, 
    userMessage: string, 
    requestId: string = 'unknown',
    options: {
      size?: string;
      quality?: string;
    } = {}
  ): Promise<{
    session: ChatSession;
    response: ChatMessage;
  }> {
    console.log(`[${requestId}] 💬 CHAT SERVICE: Processing message for session ${sessionId}`);
    console.log(`[${requestId}] 📝 User message: "${userMessage}"`);
    console.log(`[${requestId}] 📐 Image size: ${options.size || '1024x1024 (default)'}`);
    console.log(`[${requestId}] ✨ Image quality: ${options.quality || 'low (default)'}`);

    const session = this.getOrCreateSession(sessionId, requestId);
    
    // Add user message to session
    this.addMessage(session.id, 'user', userMessage);

    console.log(`[${requestId}] 🤖 CHAT SERVICE: Calling OpenAI Responses API`);
    console.log(`[${requestId}] 🔗 Previous response ID: ${session.lastResponseId || 'none (new conversation)'}`);
    
    try {
      console.log(`[${requestId}] 📋 Request parameters:`, {
        model: AI_MODEL,
        input: userMessage,
        hasPreviousResponseId: !!session.lastResponseId,
        previousResponseId: session.lastResponseId || 'none'
      });

      const response = await this.openai.responses.create({
        model: AI_MODEL,
        previous_response_id: session.lastResponseId,
        input: userMessage,
        tools: [{
            type: "image_generation",
            quality: (options.quality || "low") as "auto" | "low" | "medium" | "high",
            output_format: "png",
            moderation: "low",
            size: (options.size || "1024x1024") as "1024x1024" | "1024x1536" | "1536x1024",
          },]
      });

      console.log(`[${requestId}] 📊 OpenAI Responses API response:`, {
        responseId: response.id,
        outputCount: response.output?.length || 0,
        hasImageGeneration: response.output?.some(o => o.type === 'image_generation_call') || false
      });

      // Update session with new response ID
      session.lastResponseId = response.id;
      session.updatedAt = new Date().toISOString();

      // Process the response output
      const imageOutputs = response.output?.filter(output => output.type === 'image_generation_call') || [];
      const messageOutputs = response.output?.filter(output => output.type === 'message') || [];

      let responseContent = '';
      let imageData: any = null;

      // Handle message responses
      if (messageOutputs.length > 0) {
        responseContent = messageOutputs.map(output => (output as any).content).join('\n');
      }

      // Handle image generation
      if (imageOutputs.length > 0) {
        console.log(`[${requestId}] 🎨 CHAT SERVICE: Delegating image processing to ImageUtil`);
        
        const imageResult = await ImageUtil.processImageOutputs(imageOutputs, requestId, {
          model: AI_MODEL,
          size: options.size || '1024x1024',
          quality: options.quality || 'low',
          prompt: userMessage
        });
        
        if (imageResult) {
          imageData = {
            localImageUrl: imageResult.localImageUrl,
            filename: imageResult.filename
          };
          
          console.log(`[${requestId}] ✅ CHAT SERVICE: Image processed and saved: ${imageResult.filename}`);
          
          // Add descriptive text if none provided
          if (!responseContent) {
            responseContent = `I've generated an image based on your request.`;
          }
        } else {
          console.log(`[${requestId}] ⚠️  CHAT SERVICE: No image data returned from ImageUtil`);
        }
      }

      // Fallback response if no content
      if (!responseContent && !imageData) {
        responseContent = "I understand your request. How would you like me to help you with image generation?";
      }

      // Create response message
      const responseMessage = this.addMessage(
        session.id, 
        'assistant', 
        responseContent,
        {
          ...imageData,
          responseId: response.id
        }
      );

      console.log(`[${requestId}] ✅ CHAT SERVICE: Response processed and added to chat`);

      return {
        session,
        response: responseMessage
      };
      
    } catch (error) {
      console.error(`[${requestId}] 💥 OpenAI Responses API error:`, error);
      
      // Create error response message
      const errorMessage = this.addMessage(
        session.id,
        'assistant',
        `I apologize, but I encountered an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      
      return {
        session,
        response: errorMessage
      };
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }
}
