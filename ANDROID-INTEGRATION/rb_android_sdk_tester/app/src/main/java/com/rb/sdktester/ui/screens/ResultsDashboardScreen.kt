package com.rb.sdktester.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.gson.GsonBuilder
import com.rb.sdktester.SdkResult
import com.rb.sdktester.network.ApiClient
import com.rb.sdktester.network.WebhookQueryResponse
import com.rb.sdktester.ui.theme.*
import kotlinx.coroutines.launch

/**
 * Results Dashboard Screen
 *
 * 3-tab results view shown after the HyperVerge SDK workflow completes:
 *  Tab 1 — SDK Response   : raw result data returned directly by the SDK
 *  Tab 2 — Outputs API    : webhook result fetched from the backend (auto-fetched on load)
 *  Tab 3 — Webhooks       : explanation of how the webhook flow works + manual fetch button
 *
 * @param sdkResult   Result returned by the HyperVerge SDK
 * @param transactionId Transaction ID used for this session
 * @param onStartNewFlow Called when the user taps "Start Another Flow"
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResultsDashboardScreen(
    sdkResult: SdkResult,
    transactionId: String?,
    onStartNewFlow: () -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    var webhookResult by remember { mutableStateOf<WebhookQueryResponse?>(null) }
    var isLoadingWebhook by remember { mutableStateOf(false) }
    var webhookError by remember { mutableStateOf<String?>(null) }
    val coroutineScope = rememberCoroutineScope()

    // Auto-fetch webhook results when screen opens
    LaunchedEffect(transactionId) {
        if (transactionId != null) {
            kotlinx.coroutines.delay(600) // brief delay so SDK result settles
            isLoadingWebhook = true
            webhookError = null
            try {
                val response = ApiClient.apiService.getWebhookResults(transactionId)
                if (response.isSuccessful) {
                    webhookResult = response.body()
                } else {
                    webhookError = "Backend error: ${response.code()}"
                }
            } catch (e: Exception) {
                webhookError = "Network error: ${e.message}"
            } finally {
                isLoadingWebhook = false
            }
        }
    }

    fun fetchWebhookManually() {
        if (transactionId == null || isLoadingWebhook) return
        coroutineScope.launch {
            isLoadingWebhook = true
            webhookError = null
            try {
                val response = ApiClient.apiService.getWebhookResults(transactionId)
                if (response.isSuccessful) {
                    webhookResult = response.body()
                } else {
                    webhookError = "Backend error: ${response.code()}"
                }
            } catch (e: Exception) {
                webhookError = "Network error: ${e.message}"
            } finally {
                isLoadingWebhook = false
            }
        }
    }

    Scaffold(
        topBar = {
            Column {
                CenterAlignedTopAppBar(
                    title = {
                        Text(
                            text = "Results Dashboard",
                            fontWeight = FontWeight.Bold
                        )
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = Primary,
                        titleContentColor = White
                    )
                )

                // Tab Row
                SecondaryTabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = Primary,
                    contentColor = White
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = {
                            Text(
                                text = "SDK Response",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = {
                            Text(
                                text = "Outputs API",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    )
                    Tab(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        text = {
                            Text(
                                text = "Webhooks",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    )
                }
            }
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onStartNewFlow,
                containerColor = Warning,
                contentColor = White,
                icon = { Text("🔄", fontSize = 18.sp) },
                text = {
                    Text(
                        text = "Start Another Flow",
                        fontWeight = FontWeight.Bold
                    )
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(BackgroundLight)
        ) {
            when (selectedTab) {
                0 -> SdkResponseTab(sdkResult = sdkResult)
                1 -> OutputsApiTab(
                    isLoading = isLoadingWebhook,
                    webhookResult = webhookResult,
                    webhookError = webhookError,
                    onRetry = ::fetchWebhookManually
                )
                2 -> WebhooksTab(
                    isLoading = isLoadingWebhook,
                    webhookResult = webhookResult,
                    webhookError = webhookError,
                    onFetch = ::fetchWebhookManually
                )
            }
        }
    }
}

// =============================================================================
// TAB 1 — SDK RESPONSE
// =============================================================================

@Composable
private fun SdkResponseTab(sdkResult: SdkResult) {
    val statusColor = when (sdkResult.status.lowercase()) {
        "auto_approved" -> Success
        "auto_declined" -> Error
        "needs_review" -> Warning
        "user_cancelled" -> Neutral
        else -> Primary
    }
    val statusEmoji = when (sdkResult.status.lowercase()) {
        "auto_approved" -> "✅"
        "auto_declined" -> "❌"
        "needs_review" -> "🔍"
        "user_cancelled" -> "↩️"
        else -> "⚠️"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Status banner
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = statusColor.copy(alpha = 0.1f)),
            elevation = CardDefaults.cardElevation(0.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(text = statusEmoji, fontSize = 40.sp)
                Column {
                    Text(
                        text = sdkResult.status.replace("_", " ").uppercase(),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = statusColor
                    )
                    Text(
                        text = "SDK workflow completed",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }
            }
        }

        // Core info card
        DashboardCard(title = "Transaction Details") {
            InfoRow("Transaction ID", sdkResult.transactionId ?: "N/A")
            InfoRow("Status", sdkResult.status)
            if (sdkResult.latestModule != null) {
                InfoRow("Latest Module", sdkResult.latestModule)
            }
        }

        // Error details (if any)
        if (sdkResult.errorCode != null || sdkResult.errorMessage != null) {
            DashboardCard(title = "Error Details", headerColor = Error) {
                if (sdkResult.errorCode != null) {
                    InfoRow("Error Code", sdkResult.errorCode.toString())
                }
                if (sdkResult.errorMessage != null) {
                    InfoRow("Error Message", sdkResult.errorMessage)
                }
            }
        }

        // Additional details map
        if (sdkResult.details.isNotEmpty()) {
            DashboardCard(title = "Additional Details") {
                sdkResult.details.forEach { (key, value) ->
                    InfoRow(key, value)
                }
            }
        }

        // Raw SDK Output — full JSON blob
        val rawOutputMap = linkedMapOf<String, Any>()
        rawOutputMap["status"] = sdkResult.status
        sdkResult.transactionId?.let { rawOutputMap["transactionId"] = it }
        sdkResult.latestModule?.let { rawOutputMap["latestModule"] = it }
        sdkResult.errorCode?.let { rawOutputMap["errorCode"] = it }
        sdkResult.errorMessage?.let { rawOutputMap["errorMessage"] = it }
        if (sdkResult.details.isNotEmpty()) rawOutputMap["details"] = sdkResult.details
        CopyableJsonCard(title = "Raw SDK Output", data = rawOutputMap)

        Spacer(modifier = Modifier.height(80.dp)) // FAB clearance
    }
}

// =============================================================================
// TAB 2 — OUTPUTS API
// =============================================================================

@Composable
private fun OutputsApiTab(
    isLoading: Boolean,
    webhookResult: WebhookQueryResponse?,
    webhookError: String?,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        if (isLoading) {
            LoadingCard("Fetching outputs from backend...")
        } else if (webhookError != null) {
            ErrorCard(message = webhookError, onRetry = onRetry)
        } else if (webhookResult == null || webhookResult.found == false || webhookResult.data == null) {
            EmptyStateCard(
                emoji = "📡",
                title = "No Outputs Yet",
                message = "Webhook results will appear here once HyperVerge fires the finish_transaction event to the backend.",
                onRetry = onRetry
            )
        } else {
            val data = webhookResult.data

            DashboardCard(title = "Webhook Information") {
                InfoRow("Transaction ID", data.transactionId)
                if (data.workflowId != null) InfoRow("Workflow ID", data.workflowId)
                if (data.status != null) InfoRow("Status", data.status)
                if (data.timestamp != null) InfoRow("Timestamp", data.timestamp)
                if (data.receivedAt != null) InfoRow("Received At", data.receivedAt)
            }

            if (!data.result.isNullOrEmpty()) {
                JsonCard(title = "Result Data", data = data.result)
            }

            if (!data.rawData.isNullOrEmpty()) {
                JsonCard(title = "Raw Webhook Data", data = data.rawData)
            }
        }

        Spacer(modifier = Modifier.height(80.dp))
    }
}

// =============================================================================
// TAB 3 — WEBHOOKS
// =============================================================================

@Composable
private fun WebhooksTab(
    isLoading: Boolean,
    webhookResult: WebhookQueryResponse?,
    webhookError: String?,
    onFetch: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Status indicator
        DashboardCard(title = "Webhook Listener", headerColor = Success) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .background(Success, shape = RoundedCornerShape(6.dp))
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "Listening for finish_transaction event...",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
            }
        }

        // How it works steps
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = White),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "ℹ️  How it works",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Primary
                )
                Spacer(modifier = Modifier.height(16.dp))
                StepItem("1", "SDK sends finish_transaction event to backend")
                Spacer(modifier = Modifier.height(8.dp))
                StepItem("2", "Backend webhook endpoint receives the event")
                Spacer(modifier = Modifier.height(8.dp))
                StepItem("3", "Event is stored in server memory")
                Spacer(modifier = Modifier.height(8.dp))
                StepItem("4", "Tap button below to fetch stored results")
            }
        }

        // Fetch button
        Button(
            onClick = onFetch,
            enabled = !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Primary)
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(22.dp),
                    color = White,
                    strokeWidth = 3.dp
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text("Calling API...", fontWeight = FontWeight.Bold)
            } else {
                Text("☁️  Call Results API", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Webhook error
        if (webhookError != null) {
            ErrorCard(message = webhookError, onRetry = onFetch)
        }

        // Latest result summary
        if (webhookResult?.data != null) {
            val data = webhookResult.data
            DashboardCard(title = "Latest Result", headerColor = Success) {
                InfoRow("Transaction ID", data.transactionId)
                if (data.status != null) InfoRow("Status", data.status)
                if (data.timestamp != null) InfoRow("Timestamp", data.timestamp)
            }
        }

        Spacer(modifier = Modifier.height(80.dp))
    }
}

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

@Composable
private fun DashboardCard(
    title: String,
    headerColor: androidx.compose.ui.graphics.Color = Primary,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = White),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = headerColor
            )
            Spacer(modifier = Modifier.height(12.dp))
            content()
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = TextSecondary,
            modifier = Modifier.weight(0.38f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall,
            color = TextPrimary,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.weight(0.62f),
            textAlign = TextAlign.End
        )
    }
    HorizontalDivider(
        modifier = Modifier.padding(vertical = 2.dp),
        color = Grey200,
        thickness = 0.5.dp
    )
}

@Composable
private fun CopyableJsonCard(title: String, data: Map<String, Any>) {
    val context = LocalContext.current
    val jsonString = formatJson(data)
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = White),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = Primary
                )
                IconButton(
                    onClick = {
                        val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        cm.setPrimaryClip(ClipData.newPlainText("sdk_output", jsonString))
                    },
                    modifier = Modifier.size(36.dp)
                ) {
                    Text("📋", style = MaterialTheme.typography.bodyLarge)
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = Grey100
            ) {
                Text(
                    text = jsonString,
                    style = MaterialTheme.typography.bodySmall,
                    fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                    color = TextPrimary,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp)
                )
            }
        }
    }
}

@Composable
private fun JsonCard(title: String, data: Map<String, Any>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = White),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = Primary
            )
            Spacer(modifier = Modifier.height(12.dp))
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = Grey100
            ) {
                Text(
                    text = formatJson(data),
                    style = MaterialTheme.typography.bodySmall,
                    fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                    color = TextPrimary,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp)
                )
            }
        }
    }
}

@Composable
private fun LoadingCard(message: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = White),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            CircularProgressIndicator(color = Primary)
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun ErrorCard(message: String, onRetry: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = ErrorBackground),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("⚠️", fontSize = 32.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodySmall,
                color = ErrorDark,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedButton(onClick = onRetry) {
                Text("Retry", color = Error)
            }
        }
    }
}

@Composable
private fun EmptyStateCard(
    emoji: String,
    title: String,
    message: String,
    onRetry: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = White),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(emoji, fontSize = 48.sp)
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(20.dp))
            OutlinedButton(onClick = onRetry) {
                Text("Retry Fetch")
            }
        }
    }
}

@Composable
private fun StepItem(step: String, text: String) {
    Row(verticalAlignment = Alignment.Top) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .background(Primary.copy(alpha = 0.15f), shape = RoundedCornerShape(14.dp)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = step,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = Primary
            )
        }
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            modifier = Modifier.padding(top = 4.dp)
        )
    }
}

private fun formatJson(data: Map<String, Any>): String {
    return try {
        GsonBuilder().setPrettyPrinting().create().toJson(data)
    } catch (e: Exception) {
        data.toString()
    }
}
