package com.rb.sdktester.network

import com.rb.sdktester.BuildConfig

/**
 * Environment Configuration Singleton
 *
 * Mirrors Flutter's ApiConfig — holds the active environment state
 * (Development vs Production) and provides the current base URL.
 *
 * The URL is mutable at runtime so the user can switch without rebuilding.
 * ApiClient reads this whenever it creates a new Retrofit instance.
 */
object EnvironmentConfig {

    // =========================================================================
    // ENVIRONMENT CONSTANTS
    // =========================================================================

    /** Local development backend — physical device on same WiFi */
    val devBaseUrl: String = BuildConfig.DEV_BASE_URL

    /** Production backend — Vercel deployment */
    val prodBaseUrl: String = BuildConfig.PROD_BASE_URL

    // =========================================================================
    // RUNTIME STATE
    // =========================================================================

    /** true = Production, false = Development */
    var isProduction: Boolean = false
        private set

    // =========================================================================
    // ACCESSORS
    // =========================================================================

    /** Currently active base URL */
    val baseUrl: String
        get() = if (isProduction) prodBaseUrl else devBaseUrl

    /** Human-readable environment name */
    val environmentName: String
        get() = if (isProduction) "Production" else "Development"

    // =========================================================================
    // ACTIONS
    // =========================================================================

    /**
     * Switch to Development environment (local backend).
     * Also rebuilds ApiClient so new requests use the updated URL.
     */
    fun switchToDevelopment() {
        isProduction = false
        ApiClient.rebuild()
    }

    /**
     * Switch to Production environment (Vercel).
     * Also rebuilds ApiClient so new requests use the updated URL.
     */
    fun switchToProduction() {
        isProduction = true
        ApiClient.rebuild()
    }
}
