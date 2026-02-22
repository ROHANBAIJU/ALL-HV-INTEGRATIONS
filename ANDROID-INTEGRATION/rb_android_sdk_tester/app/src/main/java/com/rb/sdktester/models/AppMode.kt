package com.rb.sdktester.models

/**
 * App Operating Mode Enum
 * 
 * Defines the two modes the application can operate in:
 * - DEFAULT: Uses default credentials stored in backend environment variables
 * - DYNAMIC: Uses custom credentials provided by the user in the app
 */
enum class AppMode {
    DEFAULT,  // Uses backend default credentials (c52h5j, HV:q7aqkdhe5b39vfmeg)
    DYNAMIC;  // Uses user-provided credentials (flexible testing)
    
    /**
     * Convert enum to API mode string
     * @return "default" or "dynamic"
     */
    fun toApiMode(): String = when (this) {
        DEFAULT -> "default"
        DYNAMIC -> "dynamic"
    }
    
    companion object {
        /**
         * Get mode from API string
         * @param apiMode "default" or "dynamic"
         * @return Corresponding AppMode enum
         */
        fun fromApiMode(apiMode: String): AppMode = when (apiMode.lowercase()) {
            "default" -> DEFAULT
            "dynamic" -> DYNAMIC
            else -> DEFAULT
        }
    }
}
