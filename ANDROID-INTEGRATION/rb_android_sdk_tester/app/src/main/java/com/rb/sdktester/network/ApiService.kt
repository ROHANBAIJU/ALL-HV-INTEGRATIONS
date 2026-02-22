package com.rb.sdktester.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

/**
 * Retrofit API Service Interface
 * 
 * Defines all API endpoints for communicating with the backend server.
 * This interface is used by Retrofit to generate the HTTP client implementation.
 */
interface ApiService {
    
    /**
     * Health check endpoint to verify backend connectivity
     * 
     * GET /health
     * 
     * @return Response with health status
     */
    @GET("health")
    suspend fun healthCheck(): Response<Map<String, Any>>
    
    /**
     * Generate access token for HyperVerge SDK initialization
     * 
     * This is the main endpoint that:
     * 1. Accepts mode (default/dynamic) and transaction ID
     * 2. Optionally accepts appId, appKey, workflowId for dynamic mode
     * 3. Calls HyperVerge authentication API
     * 4. Returns short-lived access token
     * 
     * POST /api/generate-access-token
     * 
     * Request Body Example (Default Mode):
     * {
     *   "mode": "default",
     *   "transactionId": "txn_1234567890_abc"
     * }
     * 
     * Request Body Example (Dynamic Mode):
     * {
     *   "mode": "dynamic",
     *   "appId": "xyz123",
     *   "appKey": "HV:abc...",
     *   "workflowId": "custom_workflow",
     *   "transactionId": "txn_1234567890_abc"
     * }
     * 
     * Success Response (200):
     * {
     *   "success": true,
     *   "accessToken": "eyJhbG...",
     *   "workflowId": "rb_sureguard_insurance",
     *   "transactionId": "txn_1234567890_abc",
     *   "mode": "default",
     *   "expiresIn": 3600,
     *   "timestamp": "2026-02-18T10:30:00.000Z"
     * }
     * 
     * Error Response (4xx/5xx):
     * {
     *   "success": false,
     *   "error": "Error type",
     *   "message": "Detailed error message",
     *   "code": "ERROR_CODE"
     * }
     * 
     * @param request Token request with mode and credentials
     * @return Response with access token or error
     */
    /**
     * Generate access token for HyperVerge SDK initialization
     * Unified backend endpoint: POST /api/token/generate
     */
    @POST("api/token/generate")
    suspend fun generateAccessToken(
        @Body request: TokenRequest
    ): Response<TokenResponse>

    /**
     * Query webhook result stored by the backend for a given transaction.
     * GET /api/webhook/results/:transactionId
     *
     * Returns the finish_transaction event payload if HyperVerge has fired it,
     * or found=false if it hasn't arrived yet.
     */
    @GET("api/webhook/results/{transactionId}")
    suspend fun getWebhookResults(
        @retrofit2.http.Path("transactionId") transactionId: String
    ): Response<WebhookQueryResponse>
}
