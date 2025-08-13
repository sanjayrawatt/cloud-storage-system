import express from 'express';
import multer from 'multer';
import { uploadFile, getFiles, getFileDownloadUrl, deleteFile, renameFile } from '../controllers/file.js';
import authMiddleware from '../middleware/auth.js'; // Add .js extension

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', authMiddleware, upload.single('file'), uploadFile);
router.get('/', authMiddleware, getFiles);
router.get('/:id/download', authMiddleware, getFileDownloadUrl);
// Route to delete a file
router.delete('/:id', authMiddleware, deleteFile);
// Route to rename a file
router.put('/:id/rename', authMiddleware, renameFile);


export default router; // Use export default
