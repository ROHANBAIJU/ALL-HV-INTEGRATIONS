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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.gson.GsonBuilder
import com.rb.sdktester.SdkResult
import com.rb.sdktester.network.ApiClient
import com.rb.sdktester.network.LogsApiRequest
import com.rb.sdktester.network.LogsApiResponse
import com.rb.sdktester.network.OutputApiRequest
import com.rb.sdktester.network.OutputApiResponse
import com.rb.sdktester.network.WebhookQueryResponse
import com.rb.sdktester.ui.theme.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

/**
 * Results Dashboard Screen
 *
 * 3-tab results view shown after the HyperVerge SDK workflow completes:
 *  Tab 1 — SDK Response : raw result data returned directly by the SDK
 *  Tab 2 — Output API   : HV Output API results auto-fetched on load
 *  Tab 3 — Logs API     : webhook listener + conditional Logs API call button
 *
 * @param sdkResult       Result returned by the HyperVerge SDK
 * @param transactionId   Transaction ID used for this session
 * @param onStartNewFlow  Called when the user taps "New Flow"
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResultsDashboardScreen(
    sdkResult: SdkResult,
    transactionId: String?,
    onStartNewFlow: () -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val coroutineScope = rememberCoroutineScope()

    // ---- Output API state ----
    var outputApiResult by remember { mutableStateOf<OutputApiResponse?>(null) }
    var isLoadingOutputApi by remember { mutableStateOf(false) }
    var outputApiError by remember { mutableStateOf<String?>(null) }

    // ---- Webhook (Logs API tab) state ----
    var webhookResult by remember { mutableStateOf<WebhookQueryResponse?>(null) }
    var isLoadingWebhook by remember { mutableStateOf(false) }
    var webhookError by remember { mutableStateOf<String?>(null) }
    var webhookCleared by remember { mutableStateOf(false) }

    // ---- Logs API state ----
    var logsApiResult by remember { mutableStateOf<LogsApiResponse?>(null) }
    var isLoadingLogsApi by remember { mutableStateOf(false) }
    var logsApiError by remember { mutableStateOf<String?>(null) }

    // Auto-fetch Output API + webhook on mount
    LaunchedEffect(transactionId) {
        if (transactionId == null) return@LaunchedEffect
        kotlinx.coroutines.delay(400)

        // Output API
        isLoadingOutputApi = true
        outputApiError = null
        try {
            val resp = ApiClient.apiService.getOutputApiResults(
                OutputApiRequest(transactionId = transactionId)
            )
            if (resp.isSuccessful) outputApiResult = resp.body()
            else outputApiError = "Output API error: ${resp.code()}"
        } catch (e: Exception) {
            outputApiError = "Network error: ${e.message}"
        } finally {
            isLoadingOutputApi = false
        }

        // Webhook (for Logs API tab)
        isLoadingWebhook = true
        webhookError = null
        try {
            val resp = ApiClient.apiService.getWebhookResults(transactionId)
            if (resp.isSuccessful) webhookResult = resp.body()
            else if (resp.code() == 404) webhookResult = WebhookQueryResponse(success = false, found = false, message = "No webhook received yet", data = null)
            else webhookError = "Backend error: ${resp.code()}"
        } catch (e: Exception) {
            webhookError = "Network error: ${e.message}"
        } finally {
            isLoadingWebhook = false
        }
    }

    fun refreshOutputApi() {
        if (transactionId == null || isLoadingOutputApi) return
        coroutineScope.launch {
            isLoadingOutputApi = true
            outputApiError = null
            try {
                val resp = ApiClient.apiService.getOutputApiResults(
                    OutputApiRequest(transactionId = transactionId)
                )
                if (resp.isSuccessful) outputApiResult = resp.body()
                else outputApiError = "Output API error: ${resp.code()}"
            } catch (e: Exception) {
                outputApiError = "Network error: ${e.message}"
            } finally {
                isLoadingOutputApi = false
            }
        }
    }

    fun refreshWebhook() {
        if (transactionId == null || isLoadingWebhook) return
        coroutineScope.launch {
            isLoadingWebhook = true
            webhookError = null
            webhookCleared = false
            try {
                val resp = ApiClient.apiService.getWebhookResults(transactionId)
                if (resp.isSuccessful) webhookResult = resp.body()
                else if (resp.code() == 404) webhookResult = WebhookQueryResponse(success = false, found = false, message = "No webhook received yet", data = null)
                else webhookError = "Backend error: ${resp.code()}"
            } catch (e: Exception) {
                webhookError = "Network error: ${e.message}"
            } finally {
                isLoadingWebhook = false
            }
        }
    }

    fun callLogsApi() {
        if (transactionId == null || isLoadingLogsApi) return
        coroutineScope.launch {
            isLoadingLogsApi = true
            logsApiError = null
            try {
                val resp = ApiClient.apiService.getLogsApiResults(
                    LogsApiRequest(transactionId = transactionId)
                )
                if (resp.isSuccessful) logsApiResult = resp.body()
                else logsApiError = "Logs API error: ${resp.code()}"
            } catch (e: Exception) {
                logsApiError = "Network error: ${e.message}"
            } finally {
                isLoadingLogsApi = false
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
                    actions = {
                        TextButton(onClick = onStartNewFlow) {
                            Text(
                                text = "New Flow",
                                color = White,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = Primary,
                        titleContentColor = White,
                        actionIconContentColor = White
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
                        selectedContentColor = White,
                        unselectedContentColor = White.copy(alpha = 0.7f),
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
                        selectedContentColor = White,
                        unselectedContentColor = White.copy(alpha = 0.7f),
                        text = {
                            Text(
                                text = "Output API",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    )
                    Tab(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        selectedContentColor = White,
                        unselectedContentColor = White.copy(alpha = 0.7f),
                        text = {
                            Text(
                                text = "Logs API",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    )
                }
            }
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
                1 -> OutputApiTab(
                    isLoading = isLoadingOutputApi,
                    result = outputApiResult,
                    error = outputApiError,
                    onRetry = ::refreshOutputApi
                )
                2 -> LogsApiTab(
                    isLoadingWebhook = isLoadingWebhook,
                    webhookResult = webhookResult,
                    webhookError = webhookError,
                    webhookCleared = webhookCleared,
                    onRefreshWebhook = ::refreshWebhook,
                    onClearWebhook = {
                        webhookCleared = true
                        webhookResult = null
                        logsApiResult = null
                        logsApiError = null
                    },
                    isLoadingLogsApi = isLoadingLogsApi,
                    logsApiResult = logsApiResult,
                    logsApiError = logsApiError,
                    onCallLogsApi = ::callLogsApi
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

        Spacer(modifier = Modifier.height(24.dp))
    }
}

// =============================================================================
// TAB 2 — OUTPUT API
// =============================================================================

@Composable
private fun OutputApiTab(
    isLoading: Boolean,
    result: OutputApiResponse?,
    error: String?,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        when {
            isLoading -> LoadingCard("Fetching Output API results...")
            error != null -> ErrorCard(message = error, onRetry = onRetry)
            result == null -> LoadingCard("Fetching Output API results...")
            !result.success -> ErrorCard(
                message = result.message ?: "Output API returned an error",
                onRetry = onRetry
            )
            result.result == null -> EmptyStateCard(
                emoji = "📭",
                title = "No Output Data",
                message = "Output API returned success but no result data was found.",
                onRetry = onRetry
            )
            else -> {
                val data = result.result
                val appStatus = data.applicationStatus ?: "unknown"
                val statusColor = when (appStatus.lowercase()) {
                    "auto_approved" -> Success
                    "auto_declined" -> Error
                    "needs_review" -> Warning
                    else -> Neutral
                }
                val statusEmoji = when (appStatus.lowercase()) {
                    "auto_approved" -> "✅"
                    "auto_declined" -> "❌"
                    "needs_review" -> "🔍"
                    else -> "ℹ️"
                }

                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = statusColor.copy(alpha = 0.1f)
                    ),
                    elevation = CardDefaults.cardElevation(0.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(text = statusEmoji, fontSize = 36.sp)
                        Column {
                            Text(
                                text = appStatus.replace("_", " ").uppercase(),
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = statusColor
                            )
                            Text(
                                text = "Output API result",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                        }
                    }
                }

                DashboardCard(title = "Transaction Details") {
                    InfoRow("Transaction ID", data.transactionId ?: result.transactionId ?: "N/A")
                    InfoRow("Application Status", appStatus)
                }

                if (!data.userDetails.isNullOrEmpty()) {
                    JsonCard(title = "User Details", data = data.userDetails)
                }
                if (!data.debugInfo.isNullOrEmpty()) {
                    JsonCard(title = "Debug Info", data = data.debugInfo)
                }
                if (!data.reviewDetails.isNullOrEmpty()) {
                    JsonCard(title = "Review Details", data = data.reviewDetails)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}

// =============================================================================
// TAB 3 — LOGS API
// =============================================================================

@Composable
private fun LogsApiTab(
    isLoadingWebhook: Boolean,
    webhookResult: WebhookQueryResponse?,
    webhookError: String?,
    webhookCleared: Boolean,
    onRefreshWebhook: () -> Unit,
    onClearWebhook: () -> Unit,
    isLoadingLogsApi: Boolean,
    logsApiResult: LogsApiResponse?,
    logsApiError: String?,
    onCallLogsApi: () -> Unit
) {
    val webhookReceived = webhookResult?.success == true && webhookResult.data != null

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Webhook Listener Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = White),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        val dotColor = if (webhookReceived) Success else Warning
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .background(dotColor, shape = RoundedCornerShape(6.dp))
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Webhook Listener",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Primary
                        )
                    }
                    if (webhookReceived) {
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            TextButton(onClick = onRefreshWebhook, enabled = !isLoadingWebhook) {
                                Text("Refresh", color = Info, fontSize = 12.sp)
                            }
                            TextButton(onClick = onClearWebhook) {
                                Text("Clear", color = Error, fontSize = 12.sp)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                when {
                    isLoadingWebhook -> {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = Primary
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "Checking for webhook event...",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                        }
                    }
                    webhookReceived -> {
                        val data = webhookResult!!.data!!
                        Text(
                            text = "✅  Webhook event received",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium,
                            color = Success
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        data.transactionId.let { InfoRow("Transaction ID", it) }
                        if (data.status != null) InfoRow("Status", data.status)
                        if (data.timestamp != null) InfoRow("Event Time", formatUtcToLocal(data.timestamp))
                        if (data.receivedAt != null) InfoRow("Received At", formatUtcToLocal(data.receivedAt))
                        if (!data.rawData.isNullOrEmpty()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = Grey100,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = formatJson(data.rawData),
                                    style = MaterialTheme.typography.bodySmall,
                                    fontFamily = FontFamily.Monospace,
                                    color = TextPrimary,
                                    modifier = Modifier.padding(12.dp)
                                )
                            }
                        }
                    }
                    webhookError != null -> {
                        Text(
                            text = "⚠️  $webhookError",
                            style = MaterialTheme.typography.bodySmall,
                            color = Error
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedButton(onClick = onRefreshWebhook) { Text("Retry", color = Error) }
                    }
                    else -> {
                        Text(
                            text = "⏳  Waiting for finish_transaction webhook...",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedButton(onClick = onRefreshWebhook, enabled = !isLoadingWebhook) {
                            Text("Check Again")
                        }
                    }
                }
            }
        }

        // Call Logs API Button — enabled only after webhook received
        Button(
            onClick = onCallLogsApi,
            enabled = webhookReceived && !isLoadingLogsApi,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Primary,
                disabledContainerColor = Primary.copy(alpha = 0.38f)
            )
        ) {
            if (isLoadingLogsApi) {
                CircularProgressIndicator(
                    modifier = Modifier.size(22.dp),
                    color = White,
                    strokeWidth = 3.dp
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text("Calling Logs API...", fontWeight = FontWeight.Bold, color = White)
            } else {
                Text(
                    text = if (webhookReceived) "📋  Call Logs API" else "📋  Logs API (waiting for webhook)",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (webhookReceived) White else White.copy(alpha = 0.6f)
                )
            }
        }

        if (logsApiError != null) {
            ErrorCard(message = logsApiError, onRetry = onCallLogsApi)
        }

        if (logsApiResult != null) {
            val lr = logsApiResult.result
            if (lr != null) {
                DashboardCard(title = "Logs API Summary") {
                    InfoRow("Transaction ID", lr.transactionId ?: "N/A")
                    InfoRow("Application Status", lr.applicationStatus ?: "N/A")
                    InfoRow("Modules", "${lr.results?.size ?: 0} module(s)")
                }
                lr.results?.forEachIndexed { index, module ->
                    val moduleName = (module["moduleId"] as? String)
                        ?: (module["moduleName"] as? String)
                        ?: "Module ${index + 1}"
                    JsonCard(title = moduleName, data = module)
                }
            } else if (!logsApiResult.success) {
                ErrorCard(
                    message = logsApiResult.message ?: "Logs API returned an error",
                    onRetry = onCallLogsApi
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
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
                    fontFamily = FontFamily.Monospace,
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
                    fontFamily = FontFamily.Monospace,
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

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Parses an ISO-8601 UTC timestamp string and returns a local-time string,
 * e.g. "2025-01-15 22:04:17 IST" — always safe, no java.time required.
 */
private fun formatUtcToLocal(utcString: String): String {
    val outputFmt = SimpleDateFormat("yyyy-MM-dd HH:mm:ss z", Locale.US)
    outputFmt.timeZone = TimeZone.getDefault()
    val candidates = listOf(
        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
        "yyyy-MM-dd'T'HH:mm:ss'Z'",
        "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
        "yyyy-MM-dd'T'HH:mm:ssXXX"
    )
    for (pattern in candidates) {
        try {
            val fmt = SimpleDateFormat(pattern, Locale.US)
            fmt.timeZone = TimeZone.getTimeZone("UTC")
            val date = fmt.parse(utcString) ?: continue
            return outputFmt.format(date)
        } catch (_: Exception) { }
    }
    return utcString
}

private fun formatJson(data: Map<String, Any>): String {
    return try {
        GsonBuilder().setPrettyPrinting().create().toJson(data)
    } catch (e: Exception) {
        data.toString()
    }
}
