import { Request, Response } from 'express';
import { OpenAIService } from '../services/openaiService.js';

// Generate unique request ID for tracking
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class ImageRoutes {
  private openaiService: OpenAIService;

  constructor(openaiService: OpenAIService) {
    this.openaiService = openaiService;
  }

  /**
   * POST /api/generate-image
   * Generates an image from a text prompt
   */
  generateImage = async (req: Request, res: Response): Promise<void> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    console.log(`[${requestId}] 🚀 IMAGE GENERATION REQUEST STARTED`);
    console.log(`[${requestId}] ⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`[${requestId}] 🌐 Client IP: ${req.ip}`);
    console.log(`[${requestId}] 🔧 User Agent: ${req.get('User-Agent')}`);
    console.log(`[${requestId}] 📋 Request Body:`, req.body);
    
    try {
      const { prompt, model, size, quality, systemPrompt } = req.body;
      
      if (!prompt) {
        console.log(`[${requestId}] ❌ VALIDATION FAILED: Missing prompt`);
        console.log(`[${requestId}] ⏱️  Request duration: ${Date.now() - startTime}ms`);
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }
      
      console.log(`[${requestId}] ✅ VALIDATION PASSED`);
      console.log(`[${requestId}] 📝 User Prompt: "${prompt}"`);
      console.log(`[${requestId}] 🔧 System Prompt: "${systemPrompt || 'none'}"`);
      console.log(`[${requestId}] 🤖 Model: ${model || 'dall-e-2 (default)'}`);
      console.log(`[${requestId}] 📐 Size: ${size || '256x256 (default)'}`);
      console.log(`[${requestId}] ✨ Quality: ${quality || 'auto (default)'}`);
      console.log(`[${requestId}] 📏 Prompt length: ${prompt.length} characters`);
      console.log(`[${requestId}] 🎯 Calling OpenAI Service...`);
      
      const result = await this.openaiService.generateAndSaveImage(prompt, requestId, {
        model: model as 'dall-e-2' | 'dall-e-3' | 'gpt-image-1',
        size: size as '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792',
        quality: quality as 'standard' | 'hd' | 'low' | 'medium' | 'high' | 'auto',
        systemPrompt: systemPrompt
      });
      
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] 📊 Response data:`, {
        imageUrl: result.imageUrl ? 'present' : 'missing',
        localImageUrl: result.localImageUrl,
        filename: result.filename,
        savedAt: result.savedAt,
        model: result.model,
        size: result.size,
        quality: result.quality,
        finalPrompt: result.finalPrompt ? 'present' : 'missing'
      });
      console.log(`[${requestId}] ⏱️  Total request duration: ${duration}ms`);
      console.log(`[${requestId}] 🏁 REQUEST COMPLETED SUCCESSFULLY\n`);
      
      res.json(result);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${requestId}] 💥 ERROR OCCURRED:`, error);
      console.error(`[${requestId}] 📋 Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error
      });
      console.error(`[${requestId}] ⏱️  Request duration before error: ${duration}ms`);
      console.error(`[${requestId}] 🏁 REQUEST FINISHED WITH ERROR\n`);
      
      res.status(500).json({ error: 'Failed to generate image' });
    }
  };
}
