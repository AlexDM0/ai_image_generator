import { Router, Request, Response } from 'express';
import { GalleryService } from '../services/galleryService.js';

const router = Router();
const galleryService = new GalleryService();

// Get all images in the gallery
router.get('/images', async (req: Request, res: Response) => {
    const requestId = `gallery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        console.log(`🖼️ [${requestId}] Gallery request started`);
        console.log(`📊 [${requestId}] Client: ${req.ip}, User-Agent: ${req.get('User-Agent')?.substring(0, 50)}...`);
        
        const startTime = Date.now();
        const images = await galleryService.getAllImages();
        const duration = Date.now() - startTime;
        
        console.log(`✅ [${requestId}] Gallery loaded successfully`);
        console.log(`📈 [${requestId}] Found ${images.length} images in ${duration}ms`);
        console.log(`🎯 [${requestId}] Response size: ${JSON.stringify(images).length} bytes`);
        
        res.json({
            success: true,
            images,
            total: images.length,
            requestId
        });
        
    } catch (error) {
        console.error(`❌ [${requestId}] Gallery error:`, error);
        
        res.status(500).json({
            success: false,
            error: 'Failed to load gallery',
            message: error instanceof Error ? error.message : 'Unknown error',
            requestId
        });
    }
});

// Get image statistics
router.get('/stats', async (req: Request, res: Response) => {
    const requestId = `stats_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        console.log(`📊 [${requestId}] Gallery stats request started`);
        
        const startTime = Date.now();
        const stats = await galleryService.getGalleryStats();
        const duration = Date.now() - startTime;
        
        console.log(`✅ [${requestId}] Gallery stats loaded in ${duration}ms`);
        console.log(`📈 [${requestId}] Stats:`, stats);
        
        res.json({
            success: true,
            stats,
            requestId
        });
        
    } catch (error) {
        console.error(`❌ [${requestId}] Gallery stats error:`, error);
        
        res.status(500).json({
            success: false,
            error: 'Failed to load gallery statistics',
            message: error instanceof Error ? error.message : 'Unknown error',
            requestId
        });
    }
});

export default router;
