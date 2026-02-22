package com.rb.sdktester.network

import com.google.gson.annotations.SerializedName

/**
 * Request model for token generation API
 * 
 * This data class represents the request body sent to the backend
 * for generating HyperVerge access tokens.
 */
data class TokenRequest(
    /**
     * Operating mode: "default" or "dynamic"
     * - default: Uses backend environment credentials
     * - dynamic: Uses credentials provided in this request
     */
    @SerializedName("mode")
    val mode: String,
    
    /**
     * Unique transaction identifier for this verification session
     * Format: "txn_<timestamp>_<uuid>"
     * Example: "txn_1739923200_abc123xyz"
     */
    @SerializedName("transactionId")
    val transactionId: String,
    
    /**
     * HyperVerge App ID (only for dynamic mode)
     * Example: "c52h5j"
     */
    @SerializedName("appId")
    val appId: String? = null,
    
    /**
     * HyperVerge App Key (only for dynamic mode)
     * Example: "HV:q7aqkdhe5b39vfmeg"
     */
    @SerializedName("appKey")
    val appKey: String? = null,
    
    /**
     * Workflow ID from HyperVerge dashboard (only for dynamic mode)
     * Example: "rb_sureguard_insurance"
     */
    @SerializedName("workflowId")
    val workflowId: String? = null
)

/**
 * Success response model from token generation API
 */
data class TokenResponse(
    /**
     * Whether the request was successful
     */
    @SerializedName("success")
    val success: Boolean,
    
    /**
     * Short-lived access token for HyperVerge SDK initialization
     * This token is used instead of appId/appKey for enhanced security
     */
    @SerializedName("accessToken")
    val accessToken: String,
    
    /**
     * Workflow ID to be used with this token
     */
    @SerializedName("workflowId")
    val workflowId: String,
    
    /**
     * Transaction ID (echoed back from request)
     */
    @SerializedName("transactionId")
    val transactionId: String,
    
    /**
     * Mode used for this request
     */
    @SerializedName("mode")
    val mode: String,
    
    /**
     * Token expiration time in seconds (typically 3600 = 1 hour)
     */
    @SerializedName("expiresIn")
    val expiresIn: Int,
    
    /**
     * Timestamp when the token was generated
     */
    @SerializedName("timestamp")
    val timestamp: String
)

// ============================================================================
// WEBHOOK MODELS
// ============================================================================

/**
 * Webhook result stored by the backend when HyperVerge fires a finish_transaction event.
 * Query endpoint: GET /api/webhook/results/:transactionId
 */
data class WebhookResult(
    @SerializedName("transactionId")
    val transactionId: String,
    @SerializedName("workflowId")
    val workflowId: String?,
    @SerializedName("status")
    val status: String?,
    @SerializedName("timestamp")
    val timestamp: String?,
    @SerializedName("receivedAt")
    val receivedAt: String?,
    @SerializedName("result")
    val result: Map<String, Any>?,
    @SerializedName("rawData")
    val rawData: Map<String, Any>?
)

/**
 * Wrapper response for GET /api/webhook/results/:transactionId
 */
data class WebhookQueryResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("found")
    val found: Boolean,
    @SerializedName("message")
    val message: String?,
    @SerializedName("data")
    val data: WebhookResult?
)

/**
 * Error response model from token generation API
 */
data class TokenErrorResponse(
    /**
     * Always false for error responses
     */
    @SerializedName("success")
    val success: Boolean = false,
    
    /**
     * Error type/category
     */
    @SerializedName("error")
    val error: String,
    
    /**
     * Human-readable error message
     */
    @SerializedName("message")
    val message: String,
    
    /**
     * Machine-readable error code for programmatic handling
     * Examples: INVALID_MODE, MISSING_TRANSACTION_ID, NETWORK_ERROR
     */
    @SerializedName("code")
    val code: String,
    
    /**
     * Additional error details (optional)
     */
    @SerializedName("details")
    val details: Map<String, Any>? = null
)
