import OpenAI from 'openai';
import path from 'path';
import { FileUtil } from '../utils/fileUtils.js';


export class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Generate and save an image from a prompt with configurable options
   */
  async generateAndSaveImage(
    prompt: string, 
    requestId: string = 'unknown',
    options: {
      model?: OpenAI.ImageModel;
      size?: OpenAI.ImageGenerateParams['size'];
      quality?: OpenAI.ImageGenerateParams['quality'];
      systemPrompt?: string;
    } = {}
  ): Promise<{
    imageUrl: string;
    localImageUrl: string;
    filename: string;
    savedAt: string;
    model: string;
    size: string;
    quality: string;
    finalPrompt: string;
  }> {
    // Set defaults and extract options
    const model = options.model || 'dall-e-2';
    const size = options.size || '256x256';
    const quality = options.quality || 'auto';
    const systemPrompt = options.systemPrompt || '';
    
    // Combine system prompt with user prompt if provided
    const finalPrompt = systemPrompt ? `General system prompt:\n${systemPrompt}\n\n Image specific prompt:\n${prompt}` : prompt;
    
    console.log(`[${requestId}] 🎨 IMAGE GENERATION REQUEST STARTED`);
    console.log(`[${requestId}] ⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`[${requestId}] 📝 User Prompt: "${prompt}"`);
    console.log(`[${requestId}] 🔧 System Prompt: "${systemPrompt}"`);
    console.log(`[${requestId}] 📋 Final Prompt: "${finalPrompt}"`);
    console.log(`[${requestId}] 🤖 Model: ${model}`);
    console.log(`[${requestId}] 📐 Size: ${size}`);
    console.log(`[${requestId}] ✨ Quality: ${quality}`);
    console.log(`[${requestId}] 🌐 Calling OpenAI Images API...`);
    
    const startTime = Date.now();
    
    const response = await this.openai.images.generate({
      model: model,
      prompt: finalPrompt,
      quality: quality,
      n: 1,
      size: size,
    });
    
    const openaiDuration = Date.now() - startTime;
    console.log(`[${requestId}] ✅ OpenAI API call completed in ${openaiDuration}ms`);
    console.log(`[${requestId}] 📊 OpenAI Response:`, {
      dataLength: response.data?.length || 0,
      hasImageUrl: !!(response.data?.[0]?.url),
      created: response.created
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      console.error(`[${requestId}] ❌ No image URL returned from OpenAI`);
      console.error(`[${requestId}] 📋 Response data:`, response.data);
      throw new Error('No image URL returned from OpenAI');
    }
    
    console.log(`[${requestId}] 🔗 Image URL received: ${imageUrl.substring(0, 50)}...`);
    console.log(`[${requestId}] 💾 Starting file operations...`);

    // Generate filename with model, size, quality, and timestamp
    const filename = FileUtil.generateEnhancedFilename('png', {
      model: model,
      size: size,
      quality: quality,
      prompt: prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')
    });
    const imagesDir = FileUtil.getImagesDirectory();
    const filePath = path.join(imagesDir, filename);
    
    console.log(`[${requestId}] 📁 File details:`, {
      filename: filename,
      imagesDir: imagesDir,
      fullPath: filePath
    });
    
    // Download and save the image
    console.log(`[${requestId}] ⬇️  Downloading image from OpenAI...`);
    const downloadStartTime = Date.now();
    
    await FileUtil.downloadImage(imageUrl, filePath, requestId);
    
    const downloadDuration = Date.now() - downloadStartTime;
    console.log(`[${requestId}] ✅ Image downloaded and saved in ${downloadDuration}ms`);
    console.log(`[${requestId}] 💾 Image saved to: ${filePath}`);
    
    // Return image information
    const localImageUrl = `/images/${filename}`;
    const result = {
      imageUrl: imageUrl,
      localImageUrl: localImageUrl,
      filename: filename,
      savedAt: new Date().toISOString(),
      model,
      size,
      quality,
      finalPrompt: finalPrompt
    };
    
    console.log(`[${requestId}] 🎯 OPENAI SERVICE: Image generation completed successfully`);
    console.log(`[${requestId}] 📤 Returning result:`, {
      filename: result.filename,
      localImageUrl: result.localImageUrl,
      savedAt: result.savedAt
    });
    
    return result;
  }
}
