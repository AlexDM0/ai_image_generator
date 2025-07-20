import express from 'express';
import dotenv from 'dotenv';
import { FileUtil } from './utils/fileUtils.js';
import { OpenAIService } from './services/openaiService.js';
import { ChatService } from './services/chatService.js';
import { ImageRoutes } from './routes/imageRoutes.js';
import { ChatRoutes } from './routes/chatRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import { Paths } from './utils/Paths.js';

// Load environment variables
dotenv.config();

const app = express();
const port = 3000;

// Create images directory if it doesn't exist
const imagesDir = Paths.imagesDir;
FileUtil.ensureDirectoryExists(imagesDir);

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/images', express.static(imagesDir));

// Initialize services
const openaiService = new OpenAIService(process.env.OPENAI_API_KEY!);
const chatService = new ChatService(process.env.OPENAI_API_KEY!);
const imageRoutes = new ImageRoutes(openaiService);
const chatRoutes = new ChatRoutes(chatService);

// Routes
app.post('/api/generate-image', imageRoutes.generateImage);
app.post('/api/chat/message', chatRoutes.sendMessage);
app.get('/api/chat/session/:sessionId', chatRoutes.getSession);
app.get('/api/chat/sessions', chatRoutes.getAllSessions);
app.post('/api/chat/session', chatRoutes.createSession);
app.use('/api/gallery', galleryRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
