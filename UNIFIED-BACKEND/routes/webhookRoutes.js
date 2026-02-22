const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WEBHOOK ROUTES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * These routes handle webhook callbacks from HyperVerge and result queries
 */

/**
 * POST /api/webhook/results
 * Receive verification results from HyperVerge
 * 
 * This endpoint is called by HyperVerge servers after workflow completion
 * Configure this URL in your HyperVerge dashboard webhook settings
 * 
 * Request Body: (sent by HyperVerge)
 * {
 *   "transactionId": "txn_unique_12345",
 *   "workflowId": "rb_sureguard_insurance",
 *   "status": "auto_approved" | "auto_declined" | "needs_review",
 *   "result": { ... detailed results ... },
 *   "timestamp": "2026-02-22T10:35:00.000Z"
 * }
 */
router.post('/results', webhookController.receiveWebhook);

/**
 * GET /api/webhook/results/:transactionId
 * Query stored verification results by transaction ID
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "transactionId": "txn_unique_12345",
 *     "status": "auto_approved",
 *     "result": { ... },
 *     "timestamp": "..."
 *   }
 * }
 */
router.get('/results/:transactionId', webhookController.getResults);

/**
 * GET /api/webhook/results
 * Get all stored results (for debugging)
 */
router.get('/results', webhookController.getAllResults);

module.exports = router;
