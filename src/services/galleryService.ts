import * as fs from 'fs';
import * as path from 'path';
import { Paths } from '../utils/Paths';

export interface GalleryImage {
    filename: string;
    filepath: string;
    url: string;
    size: number;
    createdAt: Date;
    modifiedAt: Date;
    metadata: {
        model?: string;
        size?: string;
        quality?: string;
        prompt?: string;
        type: 'direct' | 'chat' | 'unknown';
    };
}

export interface GalleryStats {
    totalImages: number;
    totalSize: number;
    byModel: Record<string, number>;
    byType: Record<string, number>;
    bySize: Record<string, number>;
    byQuality: Record<string, number>;
    oldestImage?: Date;
    newestImage?: Date;
}

export class GalleryService {
    private imagesDir: string;

    constructor() {
        this.imagesDir = Paths.imagesDir;
    }

    async getAllImages(): Promise<GalleryImage[]> {
        console.log(`🔍 [GalleryService] Scanning images directory: ${this.imagesDir}`);
        
        try {
            // Ensure images directory exists
            if (!fs.existsSync(this.imagesDir)) {
                console.log(`📁 [GalleryService] Images directory doesn't exist, creating: ${this.imagesDir}`);
                fs.mkdirSync(this.imagesDir, { recursive: true });
                return [];
            }

            const files = fs.readdirSync(this.imagesDir);
            const imageFiles = files.filter(file => 
                file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
            );

            console.log(`📊 [GalleryService] Found ${imageFiles.length} image files out of ${files.length} total files`);

            const images: GalleryImage[] = [];

            for (const filename of imageFiles) {
                try {
                    const filepath = path.join(this.imagesDir, filename);
                    const stats = fs.statSync(filepath);
                    
                    const image: GalleryImage = {
                        filename,
                        filepath,
                        url: `/images/${filename}`,
                        size: stats.size,
                        createdAt: stats.birthtime,
                        modifiedAt: stats.mtime,
                        metadata: this.parseFilenameMetadata(filename)
                    };

                    images.push(image);
                } catch (error) {
                    console.warn(`⚠️ [GalleryService] Error processing file ${filename}:`, error);
                }
            }

            // Sort by creation date (newest first)
            images.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            console.log(`✅ [GalleryService] Successfully processed ${images.length} images`);
            return images;

        } catch (error) {
            console.error(`❌ [GalleryService] Error scanning images directory:`, error);
            throw new Error(`Failed to scan images directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getGalleryStats(): Promise<GalleryStats> {
        console.log(`📊 [GalleryService] Calculating gallery statistics`);
        
        const images = await this.getAllImages();
        
        const stats: GalleryStats = {
            totalImages: images.length,
            totalSize: images.reduce((sum, img) => sum + img.size, 0),
            byModel: {},
            byType: {},
            bySize: {},
            byQuality: {}
        };

        if (images.length > 0) {
            stats.oldestImage = images[images.length - 1].createdAt;
            stats.newestImage = images[0].createdAt;
        }

        // Calculate statistics
        for (const image of images) {
            const { model, size, quality, type } = image.metadata;
            
            if (model) {
                stats.byModel[model] = (stats.byModel[model] || 0) + 1;
            }
            
            if (type) {
                stats.byType[type] = (stats.byType[type] || 0) + 1;
            }
            
            if (size) {
                stats.bySize[size] = (stats.bySize[size] || 0) + 1;
            }
            
            if (quality) {
                stats.byQuality[quality] = (stats.byQuality[quality] || 0) + 1;
            }
        }

        console.log(`✅ [GalleryService] Statistics calculated:`, {
            totalImages: stats.totalImages,
            totalSizeMB: Math.round(stats.totalSize / (1024 * 1024) * 100) / 100,
            models: Object.keys(stats.byModel).length,
            types: Object.keys(stats.byType).length
        });

        return stats;
    }

    private parseFilenameMetadata(filename: string): GalleryImage['metadata'] {
        console.log(`🔍 [GalleryService] Parsing metadata from filename: ${filename}`);
        
        const metadata: GalleryImage['metadata'] = {
            type: 'unknown'
        };

        try {
            // Enhanced filename format: timestamp_model_size_quality_prompt.png
            // Example: 20241220_143022_dall-e-3_1024x1024_hd_a-beautiful-sunset.png
            
            const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
            const parts = nameWithoutExt.split('_');
            
            if (parts.length >= 5) {
                // Enhanced format
                metadata.model = parts[1];
                metadata.size = parts[2];
                metadata.quality = parts[3];
                metadata.prompt = parts.slice(4).join('_').replace(/-/g, ' ');
                
                // Determine type based on model or other indicators
                if (filename.includes('chat') || metadata.model === 'gpt-image-1') {
                    metadata.type = 'chat';
                } else {
                    metadata.type = 'direct';
                }
            } else if (parts.length >= 2) {
                // Legacy format or partial format
                if (filename.includes('chat')) {
                    metadata.type = 'chat';
                } else if (filename.includes('direct') || filename.includes('dall-e')) {
                    metadata.type = 'direct';
                }
                
                // Try to extract any recognizable patterns
                for (const part of parts) {
                    if (part.includes('dall-e') || part.includes('gpt-image')) {
                        metadata.model = part;
                    } else if (part.match(/^\d+x\d+$/)) {
                        metadata.size = part;
                    } else if (['standard', 'hd', 'auto', 'low', 'medium', 'high'].includes(part)) {
                        metadata.quality = part;
                    }
                }
            }
            
            console.log(`✅ [GalleryService] Parsed metadata:`, metadata);
            
        } catch (error) {
            console.warn(`⚠️ [GalleryService] Error parsing filename metadata:`, error);
        }

        return metadata;
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
