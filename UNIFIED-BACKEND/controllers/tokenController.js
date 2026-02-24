const axios = require('axios');

// ─── Per-transaction credential cache ────────────────────────────────────────
// Keyed by transactionId → { appId, appKey }
// Only populated for dynamic-mode tokens so the webhook handler can use the
// correct credentials when auto-enriching Output + Logs API results.
const transactionCredentials = new Map();

/**
 * Look up the credentials used to create a token for a given transaction.
 * Returns undefined if the transaction was default-mode (use env vars instead).
 */
const getTransactionCredentials = (transactionId) => transactionCredentials.get(transactionId);

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TOKEN GENERATION CONTROLLER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Handles access token generation for HyperVerge SDK initialization
 * Supports DUAL MODE:
 * - Default Mode: Uses server-stored credentials
 * - Dynamic Mode: Uses client-provided credentials
 */

// HyperVerge Authentication API endpoint
const HYPERVERGE_AUTH_URL = process.env.HYPERVERGE_AUTH_URL || 
                            'https://ind-state.idv.hyperverge.co/v2/auth/token';

// Default credentials from environment variables
const DEFAULT_CREDENTIALS = {
  appId: process.env.DEFAULT_APP_ID,
  appKey: process.env.DEFAULT_APP_KEY,
  workflowId: process.env.DEFAULT_WORKFLOW_ID
};

/**
 * Generate Access Token
 * POST /api/token/generate
 */
const generateToken = async (req, res) => {
  try {
    const { 
      mode, 
      transactionId, 
      appId, 
      appKey, 
      workflowId,
      inputs 
    } = req.body;

    const platform = req.headers['x-platform'] || 'unknown';
    console.log(`\n🎯 Token Generation Request`);
    console.log(`   Mode: ${mode}`);
    console.log(`   Platform: ${platform}`);
    console.log(`   Transaction ID: ${transactionId}`);

    // ═══════════════════════════════════════════════════════════════════════
    // 1. VALIDATE REQUEST
    // ═══════════════════════════════════════════════════════════════════════

    // Validate mode
    if (!mode || (mode !== 'default' && mode !== 'dynamic')) {
      console.log('   ❌ Invalid mode');
      return res.status(400).json({
        success: false,
        error: 'Invalid mode',
        message: 'Mode must be either "default" or "dynamic"',
        code: 'INVALID_MODE'
      });
    }

    // Validate transaction ID
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length === 0) {
      console.log('   ❌ Missing or invalid transaction ID');
      return res.status(400).json({
        success: false,
        error: 'Missing transaction ID',
        message: 'transactionId is required and must be a non-empty string',
        code: 'MISSING_TRANSACTION_ID'
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. DETERMINE CREDENTIALS BASED ON MODE
    // ═══════════════════════════════════════════════════════════════════════

    let finalAppId, finalAppKey, finalWorkflowId;

    if (mode === 'default') {
      // DEFAULT MODE: Use environment variable credentials
      console.log('   🔧 Using DEFAULT credentials from environment');

      if (!DEFAULT_CREDENTIALS.appId || !DEFAULT_CREDENTIALS.appKey || !DEFAULT_CREDENTIALS.workflowId) {
        console.log('   ❌ Default credentials not configured on server');
        return res.status(500).json({
          success: false,
          error: 'Default credentials not configured',
          message: 'Server environment variables for default credentials are missing',
          code: 'DEFAULT_CREDENTIALS_NOT_CONFIGURED'
        });
      }

      finalAppId = DEFAULT_CREDENTIALS.appId;
      finalAppKey = DEFAULT_CREDENTIALS.appKey;
      finalWorkflowId = DEFAULT_CREDENTIALS.workflowId;

      console.log(`   ✓ App ID: ${finalAppId}`);
      console.log(`   ✓ Workflow: ${finalWorkflowId}`);

    } else if (mode === 'dynamic') {
      // DYNAMIC MODE: Use credentials from request body
      console.log('   🎛️  Using DYNAMIC credentials from client');

      // Validate that all required fields are provided
      if (!appId || !appKey || !workflowId) {
        console.log('   ❌ Missing dynamic credentials');
        return res.status(400).json({
          success: false,
          error: 'Missing credentials',
          message: 'For dynamic mode, appId, appKey, and workflowId are required',
          code: 'MISSING_DYNAMIC_CREDENTIALS'
        });
      }

      // Validate credential formats
      if (typeof appId !== 'string' || appId.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid appId',
          message: 'appId must be a non-empty string',
          code: 'INVALID_APP_ID'
        });
      }

      if (typeof appKey !== 'string' || appKey.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid appKey',
          message: 'appKey must be a non-empty string',
          code: 'INVALID_APP_KEY'
        });
      }

      if (typeof workflowId !== 'string' || workflowId.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid workflowId',
          message: 'workflowId must be a non-empty string',
          code: 'INVALID_WORKFLOW_ID'
        });
      }

      finalAppId = appId.trim();
      finalAppKey = appKey.trim();
      finalWorkflowId = workflowId.trim();

      // Persist credentials so the webhook handler can use the right account
      transactionCredentials.set(transactionId.trim(), { appId: finalAppId, appKey: finalAppKey });

      console.log(`   ✓ App ID: ${finalAppId}`);
      console.log(`   ✓ Workflow: ${finalWorkflowId}`);
      console.log(`   🔑 Credentials cached for txn: ${transactionId.trim()}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. PREPARE HYPERVERGE API REQUEST
    // ═══════════════════════════════════════════════════════════════════════

    console.log(`   🌐 Calling HyperVerge Auth API...`);

    const hypervergePayload = {
      appId: finalAppId,
      appKey: finalAppKey,
      transactionId: transactionId.trim(),
      workflowId: finalWorkflowId,
      expiry: 43200  // 12 hours (max: 86400 = 24 hours)
    };

    // Log workflow inputs if provided (but DON'T send to HyperVerge token API)
    // Inputs should be passed to SDK during launch, not during token generation
    let workflowInputs = null;
    if (inputs && typeof inputs === 'object' && Object.keys(inputs).length > 0) {
      console.log(`   📝 Workflow inputs received (will be used by SDK):`, inputs);
      workflowInputs = inputs;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. CALL HYPERVERGE API
    // ═══════════════════════════════════════════════════════════════════════

    const hypervergeResponse = await axios.post(
      HYPERVERGE_AUTH_URL,
      hypervergePayload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      }
    );

    console.log(`   ✅ HyperVerge API Response: ${hypervergeResponse.status}`);

    // ═══════════════════════════════════════════════════════════════════════
    // 5. EXTRACT AND RETURN ACCESS TOKEN
    // ═══════════════════════════════════════════════════════════════════════

    if (hypervergeResponse.status !== 200) {
      throw new Error(`HyperVerge API returned status ${hypervergeResponse.status}`);
    }

    const hypervergeData = hypervergeResponse.data;

    // Extract access token (handle different response formats)
    const accessToken = hypervergeData.result?.authToken || 
                       hypervergeData.result?.token || 
                       hypervergeData.token || 
                       hypervergeData.accessToken;

    if (!accessToken) {
      console.error('   ❌ No access token in HyperVerge response:', hypervergeData);
      throw new Error('Access token not found in HyperVerge API response');
    }

    console.log(`   ✅ Access token generated successfully`);
    console.log(`   📱 Platform: ${platform}`);

    // Return success response with inputs for SDK to use
    const response = {
      success: true,
      accessToken: accessToken,
      workflowId: finalWorkflowId,
      transactionId: transactionId.trim(),
      mode: mode,
      expiresIn: 43200, // 12 hours in seconds
      timestamp: new Date().toISOString(),
      platform: platform
    };

    // Include inputs in response if provided (for SDK to use during launch)
    if (workflowInputs) {
      response.inputs = workflowInputs;
      console.log(`   📦 Returning inputs for SDK usage`);
    }

    return res.status(200).json(response);

  } catch (error) {
    // ═══════════════════════════════════════════════════════════════════════
    // ERROR HANDLING
    // ═══════════════════════════════════════════════════════════════════════

    console.error('   ❌ Token generation failed:', error.message);

    if (error.response) {
      // HyperVerge API returned an error
      console.error('   📋 HyperVerge API Error:', error.response.status);
      console.error('   📋 Error Data:', error.response.data);

      return res.status(error.response.status || 500).json({
        success: false,
        error: 'HyperVerge API error',
        message: error.response.data?.message || 'Failed to generate access token from HyperVerge',
        details: error.response.data,
        code: 'HYPERVERGE_API_ERROR'
      });
    } else if (error.request) {
      // Request made but no response received
      console.error('   ❌ Network error: No response from HyperVerge API');

      return res.status(503).json({
        success: false,
        error: 'Network error',
        message: 'Could not reach HyperVerge API. Please check your internet connection.',
        code: 'NETWORK_ERROR'
      });
    } else {
      // Other errors
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
      });
    }
  }
};

module.exports = {
  generateToken,
  getTransactionCredentials,
};
