/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WEBHOOK CONTROLLER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Handles webhook callbacks from HyperVerge servers.
 * Real HV webhook payload shape (FINISH_TRANSACTION_WEBHOOK):
 * {
 *   eventType:         "FINISH_TRANSACTION_WEBHOOK"
 *   eventTime:         "2026-02-23T15:40:26Z"
 *   eventVersion:      "1.0"
 *   applicationStatus: "auto_approved" | "auto_declined" | "needs_review" |
 *                      "user_cancelled" | "error" | "kyc_in_progress" |
 *                      "manually_approved" | "manually_declined"
 *   transactionId:     "txn_..."
 *   eventId:           "abc-123"
 * }
 *
 * On receipt we immediately fetch Output API + Logs API server-side
 * and store all three together so clients can retrieve the full picture.
 */

const axios = require('axios');

// In-memory store — replace with DB in production
const verificationResults = new Map();

// Helpers to call HV APIs after webhook arrives
const HV_REGION     = process.env.HV_REGION || 'ind';
const HV_OUTPUT_URL = `https://${HV_REGION}.idv.hyperverge.co/v1/output`;
const HV_LOGS_URL   = `https://${HV_REGION}.idv.hyperverge.co/v1/link-kyc/results`;

const fetchOutputApi = async (transactionId) => {
  const appId  = process.env.DEFAULT_APP_ID;
  const appKey = process.env.DEFAULT_APP_KEY;
  if (!appId || !appKey) return null;
  try {
    const r = await axios.post(HV_OUTPUT_URL,
      { transactionId, sendDebugInfo: 'yes', sendReviewDetails: 'yes' },
      { headers: { 'Content-Type': 'application/json', appId, appKey }, timeout: 15000 }
    );
    return r.data;
  } catch (e) {
    console.error('   ⚠️  Auto Output API fetch failed:', e.message);
    return null;
  }
};

const fetchLogsApi = async (transactionId) => {
  const appId  = process.env.DEFAULT_APP_ID;
  const appKey = process.env.DEFAULT_APP_KEY;
  if (!appId || !appKey) return null;
  try {
    const r = await axios.post(HV_LOGS_URL,
      { transactionId, sendFlag: 'yes', sendUserDetails: 'yes', sendDebugInfo: 'yes', includePreviousAttempts: 'yes' },
      { headers: { 'Content-Type': 'application/json', appId, appKey }, timeout: 20000 }
    );
    return r.data;
  } catch (e) {
    console.error('   ⚠️  Auto Logs API fetch failed:', e.message);
    return null;
  }
};

/**
 * Receive Webhook from HyperVerge
 * POST /api/webhook/results
 */
const receiveWebhook = async (req, res) => {
  try {
    console.log('\n🔔 Webhook received from HyperVerge');
    console.log('   Timestamp:', new Date().toISOString());
    
    const webhookData = req.body;

    // Log received data
    console.log('   Raw payload:', JSON.stringify(webhookData, null, 2).substring(0, 600));

    // Real HV payload uses applicationStatus + eventType
    // Support both formats (real HV format and legacy test format)
    const transactionId     = webhookData.transactionId;
    const applicationStatus = webhookData.applicationStatus || webhookData.status;
    const eventType         = webhookData.eventType || 'FINISH_TRANSACTION_WEBHOOK';
    const eventTime         = webhookData.eventTime || webhookData.timestamp || new Date().toISOString();
    const eventId           = webhookData.eventId;

    if (!transactionId) {
      console.error('   ❌ Invalid webhook: Missing transactionId');
      return res.status(400).json({ success: false, error: 'Missing transactionId in webhook payload' });
    }

    // Acknowledge HyperVerge immediately (must respond fast — HV may retry if slow)
    res.status(200).json({ success: true, message: 'Webhook received', transactionId });

    console.log(`   ✅ Ack sent — txn: ${transactionId} | status: ${applicationStatus} | event: ${eventType}`);

    // Store webhook payload first so clients can see it instantly
    const entry = {
      transactionId,
      applicationStatus,
      eventType,
      eventTime,
      eventId,
      receivedAt: new Date().toISOString(),
      webhookRaw: webhookData,
      outputApiData: null,
      logsApiData: null,
      enrichedAt: null,
    };
    verificationResults.set(transactionId, entry);
    console.log(`   📦 Stored — total in memory: ${verificationResults.size}`);

    // Auto-enrich: fetch Output API + Logs API in parallel (after responding to HV)
    // Only for terminal states that have data
    const terminalStates = ['auto_approved','auto_declined','needs_review','user_cancelled','error','manually_approved','manually_declined'];
    if (terminalStates.includes(applicationStatus)) {
      console.log(`   🔄 Auto-fetching Output + Logs APIs for ${transactionId}...`);
      const [outputData, logsData] = await Promise.all([
        fetchOutputApi(transactionId),
        fetchLogsApi(transactionId),
      ]);
      entry.outputApiData = outputData;
      entry.logsApiData   = logsData;
      entry.enrichedAt    = new Date().toISOString();
      verificationResults.set(transactionId, entry);
      console.log(`   ✅ Enriched — Output: ${outputData?.result?.status ?? 'n/a'} | Logs modules: ${logsData?.result?.results?.length ?? 'n/a'}`);
    } else {
      console.log(`   ⏭️  Skipping enrichment for non-terminal status: ${applicationStatus}`);
    }

  } catch (error) {
    console.error('   ❌ Error processing webhook:', error.message);
    // Response already sent above — just log
  }
};

/**
 * Get verification results by transaction ID
 * GET /api/webhook/results/:transactionId
 */
const getResults = async (req, res) => {
  try {
    const { transactionId } = req.params;
    console.log(`\n📊 Query results for transaction: ${transactionId}`);

    if (!verificationResults.has(transactionId)) {
      console.log('   ❌ No results found');
      return res.status(404).json({
        success: false,
        error: 'Results not found',
        message: `No verification results found for transaction: ${transactionId}`,
        tip: 'Webhook has not been received for this transaction yet'
      });
    }

    const entry = verificationResults.get(transactionId);
    console.log(`   ✅ Results found — status: ${entry.applicationStatus} | enriched: ${!!entry.enrichedAt}`);

    return res.status(200).json({
      success: true,
      data: {
        transactionId:     entry.transactionId,
        applicationStatus: entry.applicationStatus,
        eventType:         entry.eventType,
        eventTime:         entry.eventTime,
        receivedAt:        entry.receivedAt,
        enrichedAt:        entry.enrichedAt,
        webhookRaw:        entry.webhookRaw,
        outputApiData:     entry.outputApiData,
        logsApiData:       entry.logsApiData,
      }
    });
  } catch (error) {
    console.error('   ❌ Error fetching results:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch results', message: error.message });
  }
};

/**
 * Get all stored results (for debugging)
 * GET /api/webhook/results
 */
const getAllResults = async (req, res) => {
  try {
    console.log(`\n📊 Query all results - Total: ${verificationResults.size}`);

    const allResults = Array.from(verificationResults.entries()).map(([id, data]) => ({
      transactionId: id,
      status: data.status,
      workflowId: data.workflowId,
      timestamp: data.timestamp,
      receivedAt: data.receivedAt
    }));

    return res.status(200).json({
      success: true,
      count: allResults.length,
      results: allResults
    });

  } catch (error) {
    console.error('   ❌ Error fetching all results:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch results',
      message: error.message
    });
  }
};

module.exports = {
  receiveWebhook,
  getResults,
  getAllResults
};
