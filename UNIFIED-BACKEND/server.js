/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UNIFIED HYPERVERGE BACKEND
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This unified backend serves BOTH Android and Flutter applications.
 * 
 * Features:
 * - 🎛️  Dual Mode: Default & Dynamic credential modes
 * - 📱 Cross-Platform: Works with Android (Kotlin) & Flutter (Dart)
 * - 🔔 Webhook Support: Receives verification results from HyperVerge
 * - 📁 File Upload: Handles file uploads for workflow inputs
 * - 🔒 Secure: Access token-based authentication
 * - 🚀 Vercel-Ready: Serverless deployment configuration
 * 
 * Author: Rohan Baiju - Integration Engineer
 * Date: February 2026
 * Version: 2.0.0
 * ═══════════════════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import routes
const tokenRoutes = require('./routes/tokenRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const fileRoutes = require('./routes/fileRoutes');
const resultsRoutes = require('./routes/resultsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// CORS Configuration - Allow both mobile apps and web clients
// Fully open CORS — this backend serves Android, Flutter, React Native & Web clients
app.use(cors({
  origin: true, // reflect the request origin — allows all origins with credentials
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Platform',
    'x-platform', // lowercase variant (browsers send lowercase)
  ],
  exposedHeaders: ['Content-Length'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

// Explicitly handle OPTIONS preflight for all routes
app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 files
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const platform = req.headers['x-platform'] || 'unknown';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} | Platform: ${platform}`);
  next();
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// ═══════════════════════════════════════════════════════════════════════════
// ROOT & HEALTH CHECK ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Root endpoint - Server information
 * GET /
 */
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Unified HyperVerge Backend',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    platforms: ['Android', 'Flutter'],
    features: [
      'Dual Mode Authentication (Default/Dynamic)',
      'Access Token Generation',
      'Webhook Processing',
      'File Upload Support',
      'Cross-Platform Compatible'
    ],
    endpoints: {
      health: 'GET /health',
      tokenGeneration: 'POST /api/token/generate',
      webhookReceive: 'POST /api/webhook/results',
      webhookQuery: 'GET /api/webhook/results/:transactionId',
      webhookConfig: 'GET|POST|PUT /api/webhook/config',
      outputApi: 'POST /api/results/output',
      logsApi: 'POST /api/results/logs',
      fileUpload: 'POST /api/files/upload',
      serverIp: 'GET /api/server-ip'
    },
    defaultCredentials: {
      configured: !!(process.env.DEFAULT_APP_ID && process.env.DEFAULT_APP_KEY),
      appId: process.env.DEFAULT_APP_ID || 'Not configured',
      workflowId: process.env.DEFAULT_WORKFLOW_ID || 'Not configured'
    }
  });
});

/**
 * Health check endpoint
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Unified HyperVerge Backend is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Get server's outbound IP address
 * GET /api/server-ip
 * Useful for IP whitelisting in HyperVerge dashboard
 */
app.get('/api/server-ip', async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
    res.json({
      success: true,
      ip: response.data.ip,
      message: 'Add this IP to HyperVerge dashboard whitelist',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch server IP',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.use('/api/token', tokenRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/results', resultsRoutes);

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global Error Handler:', err);
  console.error('Stack:', err.stack);
  
  // Handle multer file upload errors
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: 'File upload error',
      message: err.message,
      code: err.code
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler - Must be last
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `The endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/server-ip',
      'POST /api/token/generate',
      'POST /api/webhook/results',
      'GET /api/webhook/results/:transactionId',
      'POST /api/files/upload'
    ]
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SERVER STARTUP
// ═══════════════════════════════════════════════════════════════════════════

// Start server only in non-serverless environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('\n' + '═'.repeat(70));
    console.log('🚀 UNIFIED HYPERVERGE BACKEND - STARTED');
    console.log('═'.repeat(70));
    console.log(`📡 Server:      http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📱 Platforms:   Android + Flutter`);
    console.log(`✅ Default Mode: ${process.env.DEFAULT_APP_ID ? 'Configured ✓' : 'Not Configured ✗'}`);
    console.log(`🔑 App ID:      ${process.env.DEFAULT_APP_ID || 'Not set'}`);
    console.log(`📋 Workflow:    ${process.env.DEFAULT_WORKFLOW_ID || 'Not set'}`);
    console.log('═'.repeat(70));
    console.log('\n📍 Available Endpoints:');
    console.log('   GET  /                               - Server info');
    console.log('   GET  /health                         - Health check');
    console.log('   GET  /api/server-ip                  - Get outbound IP');
    console.log('   POST /api/token/generate             - Generate access token');
    console.log('   POST /api/webhook/results            - Receive webhook');
    console.log('   GET  /api/webhook/results/:txnId     - Query webhook result');
    console.log('   POST /api/files/upload               - Upload file');
    console.log('═'.repeat(70));
    console.log('\n✨ Ready to accept requests from Android & Flutter apps!\n');
  });
}

// Export for Vercel serverless deployment
module.exports = app;
