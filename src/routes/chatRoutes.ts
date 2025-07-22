import { Request, Response } from 'express';
import { ChatService } from '../services/chatService.js';

// Generate unique request ID for tracking
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class ChatRoutes {
  private chatService: ChatService;

  constructor(chatService: ChatService) {
    this.chatService = chatService;
  }

  /**
   * POST /api/chat/message
   * Send a message to the chat and get a response
   */
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    const requestId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    console.log(`[${requestId}] 💬 CHAT MESSAGE REQUEST STARTED`);
    console.log(`[${requestId}] ⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`[${requestId}] 🌐 Client IP: ${req.ip}`);
    console.log(`[${requestId}] 📋 Request Body:`, req.body);
    
    try {
      const { sessionId, message, size, quality } = req.body;
      
      console.log(`[${requestId}] 📋 Request Body:`, {
        message: message ? `"${message}"` : null,
        messageLength: message ? message.length : 0,
        sessionId: sessionId || 'none',
        hasMessage: !!message
      });
      
      if (!message) {
        console.log(`[${requestId}] ❌ VALIDATION FAILED: Missing message`);
        console.log(`[${requestId}] ⏱️  Request duration: ${Date.now() - startTime}ms`);
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      console.log(`[${requestId}] ✅ VALIDATION PASSED`);
      console.log(`[${requestId}] 💬 Session ID: ${sessionId}`);
      console.log(`[${requestId}] 📝 Message: "${message}"`);
      console.log(`[${requestId}] 📐 Image size: ${size || '1024x1024 (default)'}`);
      console.log(`[${requestId}] ✨ Image quality: ${quality || 'low (default)'}`);
      console.log(`[${requestId}] 📏 Message length: ${message.length} characters`);
      console.log(`[${requestId}] 🎯 Calling Chat Service...`);
      
      const result = await this.chatService.processMessage(sessionId, message, requestId, {
        size: size,
        quality: quality
      });
      
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ✅ CHAT PROCESSING COMPLETED`);
      console.log(`[${requestId}] 📊 Response data:`, {
        sessionId: result.session.id,
        responseId: result.response.id,
        responseType: result.response.imageUrl ? 'image' : 'text',
        messageCount: result.session.messages.length
      });
      console.log(`[${requestId}] ⏱️  Total request duration: ${duration}ms`);
      console.log(`[${requestId}] 🏁 CHAT REQUEST FINISHED SUCCESSFULLY\n`);
      
      console.log('result', result.response.content)
      res.json({
        session: result.session,
        response: result.response
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${requestId}] 💥 CHAT ERROR OCCURRED:`, error);
      console.error(`[${requestId}] 📋 Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error
      });
      console.error(`[${requestId}] ⏱️  Request duration before error: ${duration}ms`);
      console.error(`[${requestId}] 🏁 CHAT REQUEST FINISHED WITH ERROR\n`);
      
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  };

  /**
   * GET /api/chat/session/:sessionId
   * Get a specific chat session
   */
  getSession = async (req: Request, res: Response): Promise<void> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    console.log(`[${requestId}] 📖 GET SESSION REQUEST STARTED`);
    
    try {
      const { sessionId } = req.params;
      
      console.log(`[${requestId}] 🔍 Retrieving session: ${sessionId}`);
      
      const session = this.chatService.getSession(sessionId);
      
      if (!session) {
        console.log(`[${requestId}] ❌ Session not found: ${sessionId}`);
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ✅ Session retrieved successfully`);
      console.log(`[${requestId}] 📊 Session data:`, {
        sessionId: session.id,
        messageCount: session.messages.length,
        createdAt: session.createdAt
      });
      console.log(`[${requestId}] ⏱️  Request duration: ${duration}ms`);
      console.log(`[${requestId}] 🏁 GET SESSION FINISHED SUCCESSFULLY\n`);
      
      res.json(session);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${requestId}] 💥 GET SESSION ERROR:`, error);
      console.error(`[${requestId}] ⏱️  Request duration before error: ${duration}ms`);
      console.error(`[${requestId}] 🏁 GET SESSION FINISHED WITH ERROR\n`);
      
      res.status(500).json({ error: 'Failed to retrieve session' });
    }
  };

  /**
   * GET /api/chat/sessions
   * Get all chat sessions
   */
  getAllSessions = async (req: Request, res: Response): Promise<void> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    console.log(`[${requestId}] 📚 GET ALL SESSIONS REQUEST STARTED`);
    
    try {
      const sessions = this.chatService.getAllSessions();
      
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ✅ All sessions retrieved successfully`);
      console.log(`[${requestId}] 📊 Sessions data:`, {
        sessionCount: sessions.length,
        totalMessages: sessions.reduce((sum, s) => sum + s.messages.length, 0)
      });
      console.log(`[${requestId}] ⏱️  Request duration: ${duration}ms`);
      console.log(`[${requestId}] 🏁 GET ALL SESSIONS FINISHED SUCCESSFULLY\n`);
      
      res.json(sessions);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${requestId}] 💥 GET ALL SESSIONS ERROR:`, error);
      console.error(`[${requestId}] ⏱️  Request duration before error: ${duration}ms`);
      console.error(`[${requestId}] 🏁 GET ALL SESSIONS FINISHED WITH ERROR\n`);
      
      res.status(500).json({ error: 'Failed to retrieve sessions' });
    }
  };

  /**
   * POST /api/chat/session
   * Create a new chat session
   */
  createSession = async (req: Request, res: Response): Promise<void> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    console.log(`[${requestId}] 🆕 CREATE SESSION REQUEST STARTED`);
    
    try {
      const session = this.chatService.createSession(requestId);
      
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ✅ New session created successfully`);
      console.log(`[${requestId}] 📊 Session data:`, {
        sessionId: session.id,
        createdAt: session.createdAt
      });
      console.log(`[${requestId}] ⏱️  Request duration: ${duration}ms`);
      console.log(`[${requestId}] 🏁 CREATE SESSION FINISHED SUCCESSFULLY\n`);
      
      res.json(session);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${requestId}] 💥 CREATE SESSION ERROR:`, error);
      console.error(`[${requestId}] ⏱️  Request duration before error: ${duration}ms`);
      console.error(`[${requestId}] 🏁 CREATE SESSION FINISHED WITH ERROR\n`);
      
      res.status(500).json({ error: 'Failed to create session' });
    }
  };
}
