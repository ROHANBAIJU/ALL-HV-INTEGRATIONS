const express = require('express');
const router = express.Router();
const resultsController = require('../controllers/resultsController');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RESULTS ROUTES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Server-side proxies to HyperVerge Output API and Logs API.
 * Must be backend-side — both APIs require IP whitelisting.
 */

/**
 * POST /api/results/output
 * Proxy → HyperVerge Output API (summary: status, userDetails, flags)
 * Body: { transactionId, workflowId?, sendDebugInfo?, sendReviewDetails?, appId?, appKey? }
 */
router.post('/output', resultsController.getOutput);

/**
 * POST /api/results/logs
 * Proxy → HyperVerge Logs API (full: all modules, attempts, S3 image URLs)
 * Body: { transactionId, sendFlag?, sendUserDetails?, sendDebugInfo?,
 *         includePreviousAttempts?, sendFailureReason?, appId?, appKey? }
 *
 * ⚠️  Prerequisite: webhook must have been delivered for this transaction first
 */
router.post('/logs', resultsController.getLogs);

module.exports = router;
