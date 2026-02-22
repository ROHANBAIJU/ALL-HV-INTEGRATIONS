package com.rb.sdktester.network

import com.rb.sdktester.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * API Client Singleton
 *
 * Provides the Retrofit [ApiService] instance for all HTTP calls.
 *
 * Unlike a typical Retrofit singleton, this client supports **runtime URL switching**
 * so the user can toggle between Development (local) and Production (Vercel) without
 * rebuilding the app. Call [rebuild] after changing [EnvironmentConfig.isProduction] to
 * recreate the Retrofit instance with the new base URL.
 */
object ApiClient {

    // OkHttp client — timeouts and logging don't change per environment
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BODY
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(loggingInterceptor)
        .build()

    /**
     * Current [ApiService] instance.
     * Rebuilt via [rebuild] whenever [EnvironmentConfig] is switched.
     */
    var apiService: ApiService = buildService()
        private set

    /**
     * Rebuilds the Retrofit instance using the current [EnvironmentConfig.baseUrl].
     * Called automatically by [EnvironmentConfig.switchToDevelopment/switchToProduction].
     */
    fun rebuild() {
        apiService = buildService()
    }

    private fun buildService(): ApiService {
        val url = ensureTrailingSlash(EnvironmentConfig.baseUrl)
        return Retrofit.Builder()
            .baseUrl(url)
            .addConverterFactory(GsonConverterFactory.create())
            .client(okHttpClient)
            .build()
            .create(ApiService::class.java)
    }

    /**
     * Quick health-check — returns true if the current backend is reachable.
     */
    suspend fun isBackendReachable(): Boolean {
        return try {
            val response = apiService.healthCheck()
            response.isSuccessful
        } catch (e: Exception) {
            false
        }
    }

    private fun ensureTrailingSlash(url: String): String {
        return if (url.endsWith("/")) url else "$url/"
    }
}
