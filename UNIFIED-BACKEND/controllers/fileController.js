const fs = require('fs');
const path = require('path');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FILE UPLOAD CONTROLLER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Handles file uploads for workflow inputs
 * Files can be passed to HyperVerge SDK as URLs or base64
 */

/**
 * Upload a single file
 * POST /api/files/upload
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please provide a file in the request'
      });
    }

    const file = req.file;
    const key = req.body.key || 'file';

    console.log(`\n📁 File uploaded successfully`);
    console.log(`   Filename: ${file.filename}`);
    console.log(`   Original: ${file.originalname}`);
    console.log(`   Size: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`   Type: ${file.mimetype}`);
    console.log(`   Key: ${key}`);

    // Generate public URL for the file
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;

    return res.status(200).json({
      success: true,
      file: {
        filename: file.filename,
        originalName: file.originalname,
        url: fileUrl,
        size: file.size,
        mimetype: file.mimetype,
        key: key,
        uploadedAt: new Date().toISOString()
      },
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('   ❌ File upload error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'File upload failed',
      message: error.message
    });
  }
};

/**
 * Upload multiple files
 * POST /api/files/upload-multiple
 */
const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
        message: 'Please provide files in the request'
      });
    }

    const files = req.files;
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

    console.log(`\n📁 Multiple files uploaded: ${files.length} files`);

    const uploadedFiles = files.map((file, index) => {
      const key = req.body[`key_${index}`] || `file_${index}`;
      const fileUrl = `${baseUrl}/uploads/${file.filename}`;

      console.log(`   ${index + 1}. ${file.filename} (${(file.size / 1024).toFixed(2)} KB)`);

      return {
        filename: file.filename,
        originalName: file.originalname,
        url: fileUrl,
        size: file.size,
        mimetype: file.mimetype,
        key: key,
        uploadedAt: new Date().toISOString()
      };
    });

    return res.status(200).json({
      success: true,
      count: uploadedFiles.length,
      files: uploadedFiles,
      message: `${uploadedFiles.length} files uploaded successfully`
    });

  } catch (error) {
    console.error('   ❌ Multiple file upload error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'File upload failed',
      message: error.message
    });
  }
};

/**
 * Delete an uploaded file
 * DELETE /api/files/:filename
 */
const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        message: `File ${filename} does not exist`
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    console.log(`\n🗑️  File deleted: ${filename}`);

    return res.status(200).json({
      success: true,
      message: `File ${filename} deleted successfully`
    });

  } catch (error) {
    console.error('   ❌ File deletion error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'File deletion failed',
      message: error.message
    });
  }
};

module.exports = {
  uploadFile,
  uploadMultiple,
  deleteFile
};
