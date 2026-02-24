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
    @SerializedName("applicationStatus")
    val status: String?,
    @SerializedName("eventTime")
    val timestamp: String?,
    @SerializedName("receivedAt")
    val receivedAt: String?,
    val result: Map<String, Any>? = null, // unused, kept for compat
    @SerializedName("webhookRaw")
    val rawData: Map<String, Any>?
)

/**
 * Wrapper response for GET /api/webhook/results/:transactionId
 */
data class WebhookQueryResponse(
    @SerializedName("success")
    val success: Boolean,
    val found: Boolean = false, // not in backend response; use success + data instead
    @SerializedName("message")
    val message: String?,
    @SerializedName("data")
    val data: WebhookResult?
)

// ============================================================================
// OUTPUT API MODELS
// ============================================================================

/**
 * Request body for POST /api/results/output
 * sendDebugInfo and sendReviewDetails must be the string "yes" (not boolean).
 * appId / appKey are optional — only required for dynamic-mode transactions;
 * the backend falls back to DEFAULT_APP_ID/KEY if omitted.
 */
data class OutputApiRequest(
    @SerializedName("transactionId")
    val transactionId: String,
    @SerializedName("sendDebugInfo")
    val sendDebugInfo: String = "yes",
    @SerializedName("sendReviewDetails")
    val sendReviewDetails: String = "yes",
    @SerializedName("appId")
    val appId: String? = null,
    @SerializedName("appKey")
    val appKey: String? = null
)

/**
 * Top-level response from POST /api/results/output
 */
data class OutputApiResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("message")
    val message: String?,
    @SerializedName("transactionId")
    val transactionId: String?,
    @SerializedName("result")
    val result: OutputApiResult?
)

/**
 * Inner result object from Output API response.
 * Uses Map<String, Any>? for nested objects whose structure varies per flow.
 */
data class OutputApiResult(
    @SerializedName("transactionId")
    val transactionId: String?,
    @SerializedName("status")
    val applicationStatus: String?,
    @SerializedName("userDetails")
    val userDetails: Map<String, Any>?,
    @SerializedName("debugInfo")
    val debugInfo: Map<String, Any>?,
    @SerializedName("reviewDetails")
    val reviewDetails: Map<String, Any>?
)

// ============================================================================
// LOGS API MODELS
// ============================================================================

/**
 * Request body for POST /api/results/logs
 * appId / appKey are optional — only required for dynamic-mode transactions;
 * the backend falls back to DEFAULT_APP_ID/KEY if omitted.
 */
data class LogsApiRequest(
    @SerializedName("transactionId")
    val transactionId: String,
    @SerializedName("appId")
    val appId: String? = null,
    @SerializedName("appKey")
    val appKey: String? = null
)

/**
 * Top-level response from POST /api/results/logs
 */
data class LogsApiResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("message")
    val message: String?,
    @SerializedName("transactionId")
    val transactionId: String?,
    @SerializedName("result")
    val result: LogsApiResult?
)

/**
 * Inner result object from Logs API response.
 * "results" is the array of KYC module results.
 */
data class LogsApiResult(
    @SerializedName("transactionId")
    val transactionId: String?,
    @SerializedName("applicationStatus")
    val applicationStatus: String?,
    @SerializedName("results")
    val results: List<Map<String, Any>>?
)

// ============================================================================
// WEBHOOK SUBSCRIPTION CONFIG MODELS
// ============================================================================

/**
 * Request body for POST /api/webhook/config (create) and PUT /api/webhook/config (update).
 *
 * webhookUrl  — the URL HyperVerge will POST events to (auto-derived from backend URL)
 * events      — one or more of:
 *               "FINISH_TRANSACTION_WEBHOOK"
 *               "MANUAL_REVIEW_STATUS_UPDATE"
 *               "INTERMEDIATE_TRANSACTION_WEBHOOK"
 * appId/appKey — optional; backend falls back to DEFAULT_APP_ID/KEY if omitted.
 */
data class WebhookConfigRequest(
    @SerializedName("webhookUrl")
    val webhookUrl: String,
    @SerializedName("events")
    val events: List<String>,
    @SerializedName("appId")
    val appId: String? = null,
    @SerializedName("appKey")
    val appKey: String? = null
)

/**
 * Inner result object inside the HyperVerge webhook config response.
 */
data class WebhookConfigResult(
    @SerializedName("appId")
    val appId: String?,
    @SerializedName("webhookUrl")
    val webhookUrl: String?,
    @SerializedName("created_at")
    val createdAt: String?,
    @SerializedName("updated_at")
    val updatedAt: String?,
    @SerializedName("id")
    val id: String?
)

/**
 * Top-level response for POST/PUT /api/webhook/config.
 * HyperVerge wraps the result in { statusCode, status, result } —
 * our backend forwards it with an added `success` flag.
 */
data class WebhookConfigResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("status")
    val status: String?,
    @SerializedName("statusCode")
    val statusCode: Int?,
    @SerializedName("result")
    val result: WebhookConfigResult?
)

// ============================================================================
// TOKEN ERROR MODEL
// ============================================================================

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
