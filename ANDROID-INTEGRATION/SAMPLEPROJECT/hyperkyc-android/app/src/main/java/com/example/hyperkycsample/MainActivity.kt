package com.example.hyperkycsample

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import co.hyperverge.hyperkyc.HyperKyc
import co.hyperverge.hyperkyc.data.models.HyperKycConfig
import com.example.hyperkycsample.ui.theme.TesthyperkyccomposeTheme
import com.google.gson.GsonBuilder

// HyperKYC Status Constants
object HyperKycConstants {
    const val AUTO_APPROVED: String = "auto_approved"
    const val AUTO_DECLINED: String = "auto_declined"
    const val NEEDS_REVIEW: String = "needs_review"
    const val USER_CANCELLED: String = "user_cancelled"
}

class MainActivity : ComponentActivity() {

    companion object {
        const val TAG = "HyperKycSample"
    }

    @SuppressLint("UnusedMaterial3ScaffoldPaddingParameter")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            TesthyperkyccomposeTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { paddingValues ->
                    MainScreen(modifier = Modifier.padding(paddingValues))
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(modifier: Modifier = Modifier) {
    var resultText by remember { mutableStateOf("Ready to start HyperKYC verification") }
    var isLoading by remember { mutableStateOf(false) }
    var resultStatus by remember { mutableStateOf<String?>(null) }

    // HyperKYC launcher with comprehensive result processing
    val hyperKycLauncher = rememberLauncherForActivityResult(
        contract = HyperKyc.Contract()
    ) { result ->
        isLoading = false
        resultStatus = result.status

        Log.d(MainActivity.TAG, "HyperKYC result callback called with: $result")

        // Create formatted JSON for detailed logging
        val gson = GsonBuilder().setPrettyPrinting().create()
        val dataJson = gson.toJson(result)

        Log.d(MainActivity.TAG, "Full result JSON: $dataJson")

        // Process result based on status
        resultText = when (result.status) {
            HyperKycConstants.USER_CANCELLED -> {
                Log.w(MainActivity.TAG, "User cancelled the workflow")
                buildString {
                    appendLine("🚫 **Workflow Cancelled by User**")
                    appendLine()
                    appendLine("**Status:** ${result.status}")
                    appendLine("**Transaction ID:** ${result.transactionId ?: "N/A"}")

                    // Handle details as Map<String, String>
                    if (result.details.isNotEmpty()) {
                        appendLine("**Details:**")
                        result.details.forEach { (key, value) ->
                            appendLine("  • $key: $value")
                        }
                    }

                    // Handle nullable Int errorCode
                    result.errorCode?.let {
                        appendLine("**Error Code:** $it")
                    }

                    // Handle nullable String errorMessage
                    result.errorMessage?.let {
                        appendLine("**Error Message:** $it")
                    }

                    // Handle nullable String latestModule
                    result.latestModule?.let {
                        appendLine("**Latest Module:** $it")
                    }

                    appendLine()
                    appendLine("**Full Response:**")
                    appendLine(dataJson)
                }
            }

            HyperKycConstants.AUTO_APPROVED -> {
                Log.i(MainActivity.TAG, "KYC Auto-approved successfully")
                buildString {
                    appendLine("✅ **KYC Auto-Approved**")
                    appendLine()
                    appendLine("**Status:** ${result.status}")
                    appendLine("**Transaction ID:** ${result.transactionId ?: "N/A"}")

                    if (result.details.isNotEmpty()) {
                        appendLine("**Details:**")
                        result.details.forEach { (key, value) ->
                            appendLine("  • $key: $value")
                        }
                    }

                    result.latestModule?.let {
                        appendLine("**Latest Module:** $it")
                    }

                    appendLine()
                    appendLine("🎉 **Verification completed successfully!**")
                    appendLine("The user has been automatically approved based on the submitted documents and information.")
                    appendLine()
                    appendLine("**Full Response:**")
                    appendLine(dataJson)
                }
            }

            HyperKycConstants.AUTO_DECLINED -> {
                Log.w(MainActivity.TAG, "KYC Auto-declined")
                buildString {
                    appendLine("❌ **KYC Auto-Declined**")
                    appendLine()
                    appendLine("**Status:** ${result.status}")
                    appendLine("**Transaction ID:** ${result.transactionId ?: "N/A"}")

                    if (result.details.isNotEmpty()) {
                        appendLine("**Details:**")
                        result.details.forEach { (key, value) ->
                            appendLine("  • $key: $value")
                        }
                    }

                    result.errorCode?.let {
                        appendLine("**Error Code:** $it")
                    }

                    result.errorMessage?.let {
                        appendLine("**Error Message:** $it")
                    }

                    result.latestModule?.let {
                        appendLine("**Latest Module:** $it")
                    }

                    appendLine()
                    appendLine("⚠️ **Verification declined automatically.**")
                    appendLine("The submitted information did not meet the verification criteria. Please review your documents and try again.")
                    appendLine()
                    appendLine("**Full Response:**")
                    appendLine(dataJson)
                }
            }

            HyperKycConstants.NEEDS_REVIEW -> {
                Log.i(MainActivity.TAG, "KYC requires manual review")
                buildString {
                    appendLine("🔍 **KYC Needs Manual Review**")
                    appendLine()
                    appendLine("**Status:** ${result.status}")
                    appendLine("**Transaction ID:** ${result.transactionId ?: "N/A"}")

                    if (result.details.isNotEmpty()) {
                        appendLine("**Details:**")
                        result.details.forEach { (key, value) ->
                            appendLine("  • $key: $value")
                        }
                    }

                    result.latestModule?.let {
                        appendLine("**Latest Module:** $it")
                    }

                    appendLine()
                    appendLine("⏳ **Manual review required.**")
                    appendLine("Your verification will be reviewed by our team. You will be notified once the review is complete.")
                    appendLine("Please keep your transaction ID for reference.")
                    appendLine()
                    appendLine("**Full Response:**")
                    appendLine(dataJson)
                }
            }

            else -> {
                Log.w(MainActivity.TAG, "Unknown status received: ${result.status}")
                buildString {
                    appendLine("❓ **Unknown Status: ${result.status}**")
                    appendLine()
                    appendLine("**Transaction ID:** ${result.transactionId ?: "N/A"}")

                    if (result.details.isNotEmpty()) {
                        appendLine("**Details:**")
                        result.details.forEach { (key, value) ->
                            appendLine("  • $key: $value")
                        }
                    }

                    result.errorCode?.let {
                        appendLine("**Error Code:** $it")
                    }

                    result.errorMessage?.let {
                        appendLine("**Error Message:** $it")
                    }

                    result.latestModule?.let {
                        appendLine("**Latest Module:** $it")
                    }

                    appendLine()
                    appendLine("**Full Response:**")
                    appendLine(dataJson)
                }
            }
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {

        // Header Section
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(top = 32.dp)
        ) {
            Text(
                text = "HyperKYC Sample App",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(32.dp))
        }

        // Action Section
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.Center
        ) {
            if (isLoading) {
                CircularProgressIndicator()
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Processing verification...",
                    style = MaterialTheme.typography.bodyLarge
                )
            } else {
                Button(
                    onClick = {
                        isLoading = true
                        resultText = "Starting HyperKYC verification..."
                        launchHyperKyc(hyperKycLauncher) { error ->
                            isLoading = false
                            resultText = "❌ Configuration Error: $error"
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                ) {
                    Text(
                        text = "Launch HyperKYC Verification",
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }
        }

        // Status Indicator
        resultStatus?.let { status ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                colors = CardDefaults.cardColors(
                    containerColor = when (status) {
                        HyperKycConstants.AUTO_APPROVED -> MaterialTheme.colorScheme.primaryContainer
                        HyperKycConstants.AUTO_DECLINED -> MaterialTheme.colorScheme.errorContainer
                        HyperKycConstants.NEEDS_REVIEW -> MaterialTheme.colorScheme.secondaryContainer
                        HyperKycConstants.USER_CANCELLED -> MaterialTheme.colorScheme.surfaceVariant
                        else -> MaterialTheme.colorScheme.surfaceVariant
                    }
                )
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = when (status) {
                            HyperKycConstants.AUTO_APPROVED -> "✅"
                            HyperKycConstants.AUTO_DECLINED -> "❌"
                            HyperKycConstants.NEEDS_REVIEW -> "🔍"
                            HyperKycConstants.USER_CANCELLED -> "🚫"
                            else -> "❓"
                        },
                        style = MaterialTheme.typography.headlineSmall
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = when (status) {
                                HyperKycConstants.AUTO_APPROVED -> "Auto-Approved"
                                HyperKycConstants.AUTO_DECLINED -> "Auto-Declined"
                                HyperKycConstants.NEEDS_REVIEW -> "Needs Review"
                                HyperKycConstants.USER_CANCELLED -> "User Cancelled"
                                else -> "Unknown Status"
                            },
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = when (status) {
                                HyperKycConstants.AUTO_APPROVED -> "Verification completed successfully"
                                HyperKycConstants.AUTO_DECLINED -> "Verification declined automatically"
                                HyperKycConstants.NEEDS_REVIEW -> "Manual review required"
                                HyperKycConstants.USER_CANCELLED -> "Process cancelled by user"
                                else -> "Unexpected status: $status"
                            },
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }
        }

        // Result Section
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .defaultMinSize(minHeight = 120.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Verification Details",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = resultText,
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Start
                )
            }
        }
    }
}

private fun launchHyperKyc(
    launcher: androidx.activity.result.ActivityResultLauncher<HyperKycConfig>,
    onError: (String) -> Unit
) {
    try {
        // Generate unique identifiers
        val uniqueId = HyperKyc.createUniqueId()
        val transactionId = "txn_${System.currentTimeMillis()}_$uniqueId"

        Log.d(MainActivity.TAG, "Creating HyperKYC config with transaction ID: $transactionId")

        // Create HyperKYC configuration with all requested settings
        val hyperKycConfig = HyperKycConfig(
            appId = "", // TODO: Add your actual app ID
            appKey = "", // TODO: Add your actual app key
            workflowId = "", // TODO: Add your actual workflow ID
            transactionId = transactionId
        ).apply {
            // Set input parameters
            setInputs(hashMapOf("name" to "sample name"))

            // Enable location services for enhanced verification
            setUseLocation(true)

            // Set default language to English
            setDefaultLangCode("en")

            // Set unique ID for CPR (Customer Persistent Record)
            setUniqueId("12345-abc")
        }

        Log.d(MainActivity.TAG, "HyperKYC config created successfully")


        // Launch HyperKYC
        Log.d(MainActivity.TAG, "Launching HyperKYC with config")
        launcher.launch(hyperKycConfig)

    } catch (e: Exception) {
        Log.e(MainActivity.TAG, "Failed to launch HyperKYC", e)
        onError("Failed to launch HyperKYC: ${e.message}")
    }
}

@Preview(showBackground = true)
@Composable
fun PreviewMainScreen() {
    TesthyperkyccomposeTheme {
        MainScreen()
    }
}