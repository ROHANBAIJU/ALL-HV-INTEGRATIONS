/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RESULTS CONTROLLER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Proxy endpoints for HyperVerge Output API and Logs API.
 * These MUST be called server-side because both APIs require IP whitelisting.
 * The Vercel server's IP is whitelisted — client apps call our backend,
 * and we proxy the call to HyperVerge.
 *
 * Also handles webhook subscription management (create / update / fetch).
 *
 * Endpoints:
 *   POST /api/results/output         → HV Output API  (summary)
 *   POST /api/results/logs           → HV Logs API    (full module detail)
 *   GET  /api/webhook/config         → Fetch current webhook subscription
 *   POST /api/webhook/config         → Create webhook subscription (one-time)
 *   PUT  /api/webhook/config         → Update webhook subscription
 */

const axios = require('axios');

// ─── HyperVerge API URLs ──────────────────────────────────────────────────────
const HV_REGION         = process.env.HV_REGION || 'ind';
const HV_OUTPUT_URL     = `https://${HV_REGION}.idv.hyperverge.co/v1/output`;
const HV_LOGS_URL       = `https://${HV_REGION}.idv.hyperverge.co/v1/link-kyc/results`;
const HV_WEBHOOK_CONFIG_URL = 'https://review-api.idv.hyperverge.co/api/v1/config'; // all non-US

// Read default appId/appKey from env (set at deploy time)
const getCredentials = (body) => ({
  appId:  body.appId  || process.env.DEFAULT_APP_ID,
  appKey: body.appKey || process.env.DEFAULT_APP_KEY,
});

// ─── Helper: forward HV error cleanly ────────────────────────────────────────
const forwardError = (res, error, context) => {
  if (error.response) {
    const { status, data } = error.response;
    console.error(`   ❌ HV returned ${status} for ${context}:`, data);
    return res.status(status).json({ success: false, ...data });
  }
  console.error(`   ❌ Network error for ${context}:`, error.message);
  return res.status(502).json({ success: false, error: 'Upstream request failed', message: error.message });
};

// ═══════════════════════════════════════════════════════════════════════════
// OUTPUT API PROXY
// POST /api/results/output
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Body:
 *   transactionId  (required)
 *   workflowId     (optional)
 *   appId          (optional — falls back to env DEFAULT_APP_ID)
 *   appKey         (optional — falls back to env DEFAULT_APP_KEY)
 *   sendDebugInfo      "yes"|"no"
 *   sendAllDebugInfo   "yes"|"no"
 *   sendReviewDetails  "yes"|"no"
 */
const getOutput = async (req, res) => {
  try {
    const { transactionId, workflowId, sendDebugInfo, sendAllDebugInfo, sendReviewDetails } = req.body;
    const { appId, appKey } = getCredentials(req.body);

    console.log(`\n📋 Output API proxy — txn: ${transactionId}`);

    if (!transactionId) {
      return res.status(400).json({ success: false, error: 'transactionId is required' });
    }
    if (!appId || !appKey) {
      return res.status(400).json({ success: false, error: 'appId and appKey are required (or set DEFAULT_APP_ID/DEFAULT_APP_KEY in env)' });
    }

    const payload = { transactionId };
    if (workflowId)        payload.workflowId        = workflowId;
    if (sendDebugInfo)     payload.sendDebugInfo      = sendDebugInfo;
    if (sendAllDebugInfo)  payload.sendAllDebugInfo   = sendAllDebugInfo;
    if (sendReviewDetails) payload.sendReviewDetails  = sendReviewDetails;

    const response = await axios.post(HV_OUTPUT_URL, payload, {
      headers: { 'Content-Type': 'application/json', appId, appKey },
      timeout: 15000,
    });

    console.log(`   ✅ Output API — status: ${response.data?.result?.status}`);
    return res.status(200).json({ success: true, ...response.data });

  } catch (error) {
    return forwardError(res, error, 'Output API');
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// LOGS API PROXY
// POST /api/results/logs
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Body:
 *   transactionId           (required)
 *   appId / appKey          (optional — falls back to env)
 *   sendFlag                "yes"|"no"  (default: "yes")
 *   sendUserDetails         "yes"|"no"
 *   sendDebugInfo           "yes"|"no"
 *   includePreviousAttempts "yes"|"no"  (default: "yes")
 *   generateNewLinks        "yes"|"no"
 *   sendFailureReason       "yes"|"no"
 *   sendTamperingResult     "yes"|"no"
 *
 * NOTE: Logs API prerequisite — the Results Webhook must have been
 * delivered for this transaction before this call returns data.
 */
const getLogs = async (req, res) => {
  try {
    const {
      transactionId,
      sendFlag             = 'yes',
      sendUserDetails,
      sendDebugInfo,
      includePreviousAttempts = 'yes',
      generateNewLinks,
      sendFailureReason,
      sendTamperingResult,
      bucketPathFlag,
      shouldReturnProcessedAtTime = 'yes',
    } = req.body;
    const { appId, appKey } = getCredentials(req.body);

    console.log(`\n📜 Logs API proxy — txn: ${transactionId}`);

    if (!transactionId) {
      return res.status(400).json({ success: false, error: 'transactionId is required' });
    }
    if (!appId || !appKey) {
      return res.status(400).json({ success: false, error: 'appId and appKey are required' });
    }

    const payload = {
      transactionId,
      sendFlag,
      includePreviousAttempts,
      shouldReturnProcessedAtTime,
    };
    if (sendUserDetails)        payload.sendUserDetails        = sendUserDetails;
    if (sendDebugInfo)          payload.sendDebugInfo          = sendDebugInfo;
    if (generateNewLinks)       payload.generateNewLinks       = generateNewLinks;
    if (sendFailureReason)      payload.sendFailureReason      = sendFailureReason;
    if (sendTamperingResult)    payload.sendTamperingResult    = sendTamperingResult;
    if (bucketPathFlag)         payload.bucketPathFlag         = bucketPathFlag;

    const response = await axios.post(HV_LOGS_URL, payload, {
      headers: { 'Content-Type': 'application/json', appId, appKey },
      timeout: 20000,
    });

    console.log(`   ✅ Logs API — appStatus: ${response.data?.result?.applicationStatus}`);
    return res.status(200).json({ success: true, ...response.data });

  } catch (error) {
    return forwardError(res, error, 'Logs API');
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK CONFIG — FETCH CURRENT SUBSCRIPTION
// GET /api/webhook/config
// ═══════════════════════════════════════════════════════════════════════════
const getWebhookConfig = async (req, res) => {
  try {
    const appId  = req.headers['appid']  || req.query.appId  || process.env.DEFAULT_APP_ID;
    const appKey = req.headers['appkey'] || req.query.appKey || process.env.DEFAULT_APP_KEY;

    console.log('\n📡 Fetching webhook subscription config');

    const response = await axios.get(HV_WEBHOOK_CONFIG_URL, {
      headers: { appId, appKey, 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    return res.status(200).json({ success: true, ...response.data });
  } catch (error) {
    return forwardError(res, error, 'GET webhook config');
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK CONFIG — CREATE NEW SUBSCRIPTION
// POST /api/webhook/config
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Body:
 *   webhookUrl  (required) — your backend receiver URL
 *   events      (required) — array of event names
 *   headers     (optional) — static headers HV will send with each webhook
 *   appId / appKey — optional override
 */
const createWebhookConfig = async (req, res) => {
  try {
    const { webhookUrl, events, headers: customHeaders } = req.body;
    const { appId, appKey } = getCredentials(req.body);

    console.log(`\n📡 Creating webhook subscription → ${webhookUrl}`);
    console.log(`   Events: ${(events || []).join(', ')}`);

    if (!webhookUrl || !events?.length) {
      return res.status(400).json({ success: false, error: 'webhookUrl and events[] are required' });
    }

    const payload = { webhookUrl, events };
    if (customHeaders) payload.headers = customHeaders;

    const response = await axios.post(HV_WEBHOOK_CONFIG_URL, payload, {
      headers: { appId, appKey, 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    console.log(`   ✅ Webhook subscription created — id: ${response.data?.result?.id}`);
    return res.status(200).json({ success: true, ...response.data });
  } catch (error) {
    return forwardError(res, error, 'POST webhook config');
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK CONFIG — UPDATE EXISTING SUBSCRIPTION
// PUT /api/webhook/config
// ═══════════════════════════════════════════════════════════════════════════
const updateWebhookConfig = async (req, res) => {
  try {
    const { webhookUrl, events, headers: customHeaders } = req.body;
    const { appId, appKey } = getCredentials(req.body);

    console.log(`\n📡 Updating webhook subscription → ${webhookUrl}`);

    if (!webhookUrl || !events?.length) {
      return res.status(400).json({ success: false, error: 'webhookUrl and events[] are required' });
    }

    const payload = { webhookUrl, events };
    if (customHeaders) payload.headers = customHeaders;

    const response = await axios.put(HV_WEBHOOK_CONFIG_URL, payload, {
      headers: { appid: appId, appkey: appKey, 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    console.log(`   ✅ Webhook subscription updated`);
    return res.status(200).json({ success: true, ...response.data });
  } catch (error) {
    return forwardError(res, error, 'PUT webhook config');
  }
};

module.exports = {
  getOutput,
  getLogs,
  getWebhookConfig,
  createWebhookConfig,
  updateWebhookConfig,
};
