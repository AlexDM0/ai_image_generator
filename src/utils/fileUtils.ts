import fs from 'fs';
import path from 'path';
import https from 'https';
import { Paths } from './Paths.js';

export const FileUtil = {
  /**
   * Ensures a directory exists, creating it if necessary
   */
  ensureDirectoryExists: (dirPath: string): void => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  },

  /**
   * Downloads an image from a URL and saves it to a local file
   */
  downloadImage: (url: string, filePath: string, requestId: string = 'unknown'): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log(`[${requestId}] 📁 FILE UTIL: Starting image download`);
      console.log(`[${requestId}] 🔗 Source URL: ${url.substring(0, 80)}...`);
      console.log(`[${requestId}] 💾 Target path: ${filePath}`);
      
      const file = fs.createWriteStream(filePath);
      let downloadedBytes = 0;
      
      https.get(url, (response) => {
        console.log(`[${requestId}] 📊 HTTP Response:`, {
          statusCode: response.statusCode,
          contentType: response.headers['content-type'],
          contentLength: response.headers['content-length']
        });
        
        if (response.statusCode !== 200) {
          console.error(`[${requestId}] ❌ HTTP Error: ${response.statusCode}`);
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        
        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
        });
        
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`[${requestId}] ✅ Download completed: ${downloadedBytes} bytes`);
          console.log(`[${requestId}] 💾 File saved successfully to: ${filePath}`);
          resolve(filePath);
        });
      }).on('error', (err) => {
        console.error(`[${requestId}] ❌ Download error:`, err.message);
        fs.unlink(filePath, () => {}); // Delete the file on error
        reject(err);
      });
    });
  },

  /**
   * Generates a filename with ISO timestamp
   */
  generateTimestampFilename: (extension: string = 'png'): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `image_${timestamp}.${extension}`;
  },

  /**
   * Generate an enhanced filename with model, size, quality, and prompt info
   */
  generateEnhancedFilename: (extension: string = 'png', options: {
    model?: string;
    size?: string;
    quality?: string;
    prompt?: string;
  } = {}): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const model = options.model || 'dalle2';
    const size = options.size?.replace('x', '_') || '1024_1024';
    const quality = options.quality || 'auto';
    const promptPart = options.prompt ? `_${options.prompt}` : '';
    
    return `${model}_${size}_${quality}_${timestamp}${promptPart}.${extension}`;
  },

  /**
   * Gets the images directory path
   */
  getImagesDirectory: (): string => {
    return Paths.imagesDir;
  }
};
