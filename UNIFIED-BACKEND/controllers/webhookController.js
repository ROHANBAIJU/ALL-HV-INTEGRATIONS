/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WEBHOOK CONTROLLER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Handles webhook callbacks from HyperVerge servers
 * Stores verification results and provides query endpoints
 */

// In-memory storage for verification results
// In production, use a database (MongoDB, PostgreSQL, etc.)
const verificationResults = new Map();

/**
 * Receive Webhook from HyperVerge
 * POST /api/webhook/results
 */
const receiveWebhook = async (req, res) => {
  try {
    console.log('\n🔔 Webhook received from HyperVerge');
    console.log('   Timestamp:', new Date().toISOString());
    
    const webhookData = req.body;
    
    // Log received data (truncated for security)
    console.log('   Data:', JSON.stringify(webhookData, null, 2).substring(0, 500));

    // Extract important information
    const {
      transactionId,
      workflowId,
      status,
      result,
      timestamp
    } = webhookData;

    // Validate webhook data
    if (!transactionId) {
      console.error('   ❌ Invalid webhook: Missing transactionId');
      return res.status(400).json({
        success: false,
        error: 'Missing transactionId in webhook payload'
      });
    }

    // Store the verification result
    const verificationResult = {
      transactionId,
      workflowId,
      status,
      result,
      timestamp: timestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      rawData: webhookData
    };

    verificationResults.set(transactionId, verificationResult);

    console.log(`   ✅ Result stored for transaction: ${transactionId}`);
    console.log(`   📊 Status: ${status}`);
    console.log(`   📦 Total results in memory: ${verificationResults.size}`);

    // TODO: Implement your business logic here
    // - Update database
    // - Send notifications (email, SMS, push)
    // - Trigger downstream processes
    // - Update user status
    // - Generate reports

    // Respond to HyperVerge to acknowledge receipt
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      transactionId: transactionId
    });

  } catch (error) {
    console.error('   ❌ Error processing webhook:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      message: error.message
    });
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
        message: `No verification results found for transaction: ${transactionId}`
      });
    }

    const result = verificationResults.get(transactionId);
    console.log(`   ✅ Results found - Status: ${result.status}`);

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('   ❌ Error fetching results:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch results',
      message: error.message
    });
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
