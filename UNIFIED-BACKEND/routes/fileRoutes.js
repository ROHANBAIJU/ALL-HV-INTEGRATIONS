const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const multer = require('multer');
const path = require('path');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FILE UPLOAD ROUTES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * These routes handle file uploads for workflow inputs
 * Files are stored temporarily and converted to URLs for HyperVerge SDK
 */

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  }
});

/**
 * POST /api/files/upload
 * Upload a file for workflow input
 * 
 * Content-Type: multipart/form-data
 * Form fields:
 * - file: The file to upload
 * - key: The workflow input key (optional)
 * 
 * Response:
 * {
 *   "success": true,
 *   "file": {
 *     "filename": "document-123456789.jpg",
 *     "url": "http://localhost:3000/uploads/document-123456789.jpg",
 *     "size": 245678,
 *     "mimetype": "image/jpeg",
 *     "key": "document"
 *   }
 * }
 */
router.post('/upload', upload.single('file'), fileController.uploadFile);

/**
 * POST /api/files/upload-multiple
 * Upload multiple files at once
 */
router.post('/upload-multiple', upload.array('files', 5), fileController.uploadMultiple);

/**
 * DELETE /api/files/:filename
 * Delete an uploaded file
 */
router.delete('/:filename', fileController.deleteFile);

module.exports = router;
