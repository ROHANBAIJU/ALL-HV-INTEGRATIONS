const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TOKEN GENERATION ROUTES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * These routes handle access token generation for both Android and Flutter apps
 * Supports two modes: Default (server credentials) & Dynamic (user-provided)
 */

/**
 * POST /api/token/generate
 * Generate HyperVerge access token
 * 
 * Request Body:
 * {
 *   "mode": "default" | "dynamic",
 *   "transactionId": "txn_unique_12345",
 *   
 *   // Required for dynamic mode only:
 *   "appId": "your_app_id",
 *   "appKey": "HV:your_app_key",
 *   "workflowId": "your_workflow_id",
 *   
 *   // Optional workflow inputs:
 *   "inputs": {
 *     "key1": "value1",
 *     "key2": "value2"
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "accessToken": "eyJhbGci...",
 *   "workflowId": "rb_sureguard_insurance",
 *   "transactionId": "txn_unique_12345",
 *   "mode": "default",
 *   "expiresIn": 43200,
 *   "timestamp": "2026-02-22T10:30:00.000Z"
 * }
 */
router.post('/generate', tokenController.generateToken);

module.exports = router;
