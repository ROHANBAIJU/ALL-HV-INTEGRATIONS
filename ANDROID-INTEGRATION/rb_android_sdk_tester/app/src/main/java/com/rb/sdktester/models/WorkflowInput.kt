package com.rb.sdktester.models

/**
 * Represents a single dynamic-mode workflow input.
 *
 * Each input is a key-value pair with an optional file attachment.
 * - Text mode: key + value are plain strings
 * - File/Image mode: key is a string, value holds the content URI string,
 *   and fileName holds the display name shown in the UI.
 */
data class WorkflowInput(
    val key: String,
    val value: String,
    val isFileInput: Boolean = false,
    val fileName: String? = null    // human-readable filename for file inputs
)
