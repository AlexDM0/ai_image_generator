import { FileUtil } from './fileUtils.js';
import path from 'path';

export interface ImageSaveResult {
  localImageUrl: string;
  filename: string;
  filePath: string;
}

export const ImageUtil = {
  /**
   * Save base64 image data to disk and return file information
   */
  async saveBase64Image(
    imageBase64: string, 
    requestId: string = 'unknown',
    options: {
      model?: string;
      size?: string;
      quality?: string;
      prompt?: string;
    } = {}
  ): Promise<ImageSaveResult> {
    console.log(`[${requestId}] 🖼️  IMAGE UTIL: Starting base64 image save`);
    
    // Generate enhanced filename with model, size, quality, and prompt info
    const filename = FileUtil.generateEnhancedFilename('png', {
      model: options.model || 'gpt-image-1',
      size: options.size || '1024x1024',
      quality: options.quality || 'low',
      prompt: options.prompt ? options.prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_') : 'chat_image'
    });
    const imagesDir = FileUtil.getImagesDirectory();
    const filePath = path.join(imagesDir, filename);
    
    console.log(`[${requestId}] 📁 Image file details:`, {
      filename: filename,
      imagesDir: imagesDir,
      fullPath: filePath
    });
    
    // Ensure directory exists
    FileUtil.ensureDirectoryExists(imagesDir);
    
    console.log(`[${requestId}] 💾 Writing base64 image to disk...`);
    
    // Write base64 image to file
    const fs = await import('fs');
    const startTime = Date.now();
    
    try {
      fs.writeFileSync(filePath, Buffer.from(imageBase64, 'base64'));
      
      const duration = Date.now() - startTime;
      const stats = fs.statSync(filePath);
      
      console.log(`[${requestId}] ✅ Image saved successfully in ${duration}ms`);
      console.log(`[${requestId}] 📊 File stats:`, {
        filename: filename,
        size: `${Math.round(stats.size / 1024)}KB`,
        path: filePath
      });
      
      const localImageUrl = `/images/${filename}`;
      
      return {
        localImageUrl,
        filename,
        filePath
      };
      
    } catch (error) {
      console.error(`[${requestId}] ❌ Failed to save image:`, error);
      throw new Error(`Failed to save image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Process image generation outputs from OpenAI responses API
   */
  async processImageOutputs(
    imageOutputs: any[], 
    requestId: string = 'unknown',
    options: {
      model?: string;
      size?: string;
      quality?: string;
      prompt?: string;
    } = {}
  ): Promise<ImageSaveResult | null> {
    if (imageOutputs.length === 0) {
      console.log(`[${requestId}] 📝 IMAGE UTIL: No image outputs to process`);
      return null;
    }
    
    console.log(`[${requestId}] 🎨 IMAGE UTIL: Processing ${imageOutputs.length} generated image(s)`);
    
    // Use first image output
    const imageOutput = imageOutputs[0];
    const imageBase64 = imageOutput.result;
    
    if (!imageBase64) {
      console.log(`[${requestId}] ⚠️  IMAGE UTIL: No base64 data in image output`);
      return null;
    }
    
    console.log(`[${requestId}] 📏 IMAGE UTIL: Base64 data length: ${imageBase64.length} characters`);
    
    // Save the image with enhanced filename
    return await this.saveBase64Image(imageBase64, requestId, options);
  },

  /**
   * Validate base64 image data
   */
  validateBase64Image(imageBase64: string): boolean {
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return false;
    }
    
    // Basic validation - check if it looks like base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(imageBase64) && imageBase64.length > 100; // Minimum reasonable size
  },

  /**
   * Get image file info without saving
   */
  getImageFileInfo(): { filename: string; imagesDir: string; filePath: string } {
    const filename = FileUtil.generateTimestampFilename('png');
    const imagesDir = FileUtil.getImagesDirectory();
    const filePath = path.join(imagesDir, filename);
    
    return {
      filename,
      imagesDir,
      filePath
    };
  }
};
