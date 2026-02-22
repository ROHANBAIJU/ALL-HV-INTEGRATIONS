package com.rb.sdktester.models

/**
 * HyperVerge SDK Result Status
 * 
 * Represents the possible outcomes after HyperVerge SDK workflow completion
 */
enum class SdkResultStatus {
    AUTO_APPROVED,    // ✅ Verification successful, automatically approved
    AUTO_DECLINED,    // ❌ Verification failed, automatically declined
    NEEDS_REVIEW,     // 🔍 Ambiguous result, requires manual review
    USER_CANCELLED,   // 🚫 User cancelled the workflow
    ERROR;            // ⚠️ Technical error occurred
    
    companion object {
        /**
         * Parse SDK result status string from HyperVerge SDK
         * @param status Status string from SDK callback
         * @return Corresponding SdkResultStatus enum
         */
        fun fromString(status: String?): SdkResultStatus {
            return when (status?.lowercase()) {
                "auto_approved" -> AUTO_APPROVED
                "auto_declined" -> AUTO_DECLINED
                "needs_review" -> NEEDS_REVIEW
                "user_cancelled" -> USER_CANCELLED
                "error" -> ERROR
                else -> ERROR
            }
        }
    }
}
