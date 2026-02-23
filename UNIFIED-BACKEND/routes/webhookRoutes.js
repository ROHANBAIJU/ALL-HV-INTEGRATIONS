const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const resultsController = require('../controllers/resultsController');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WEBHOOK ROUTES
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ── Receiver: HyperVerge calls this when a KYC completes ───────────────────────
// Register this URL in HV dashboard: POST /api/webhook/results
router.post('/results', webhookController.receiveWebhook);

// ── Query stored results ────────────────────────────────────────────────
router.get('/results/:transactionId', webhookController.getResults);
router.get('/results', webhookController.getAllResults);

// ── Webhook subscription management (proxies to HV config API) ──────────
// GET  /api/webhook/config  → fetch current subscription
// POST /api/webhook/config  → create subscription (one-time setup)
// PUT  /api/webhook/config  → update subscription URL/events
router.get('/config',  resultsController.getWebhookConfig);
router.post('/config', resultsController.createWebhookConfig);
router.put('/config',  resultsController.updateWebhookConfig);

module.exports = router;

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
