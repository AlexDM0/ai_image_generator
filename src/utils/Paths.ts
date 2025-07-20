import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of this file (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Calculate base paths once at module load time
const projectRoot = path.resolve(__dirname, '..', '..');
const publicDir = path.join(projectRoot, 'public');
const imagesDir = path.join(projectRoot, 'generated-images');

/**
 * Centralized path management utility
 * All paths are resolved relative to the project root directory
 */
export const Paths = {
  projectRoot,
  publicDir,
  imagesDir
};
