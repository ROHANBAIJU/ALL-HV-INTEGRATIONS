package com.rb.sdktester

import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.ActivityResultLauncher
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import co.hyperverge.hyperkyc.HyperKyc
import co.hyperverge.hyperkyc.data.models.HyperKycConfig
import com.rb.sdktester.models.AppMode
import com.rb.sdktester.models.WorkflowInput
import com.rb.sdktester.network.ApiClient
import com.rb.sdktester.network.EnvironmentConfig
import com.rb.sdktester.network.TokenRequest
import com.rb.sdktester.network.WebhookConfigRequest
import com.rb.sdktester.ui.screens.*
import com.rb.sdktester.ui.theme.RbAndroidSdkTesterTheme
import kotlinx.coroutines.launch
import java.util.UUID

/**
 * Data class to hold HyperKYC SDK result
 * Maps the result from HyperKyc.Contract() to our internal data structure
 */
data class SdkResult(
    val status: String,
    val transactionId: String?,
    val errorCode: Int?,
    val errorMessage: String?,
    val latestModule: String?,
    val details: Map<String, String>
)

/**
 * MainActivity
 * 
 * Main activity class for the HyperVerge SDK Tester app.
 * 
 * This activity manages:
 * - UI state and navigation between screens
 * - HyperVerge SDK initialization and integration
 * - Backend API communication for token generation
 * - Transaction ID generation and management
 * - Result handling from SDK workflow
 * 
 * Flow:
 * 1. User selects mode (Default/Dynamic)
 * 2. User enters credentials (if Dynamic mode)
 * 3. User generates transaction ID
 * 4. User clicks "Initialize Workflow"
 * 5. App calls backend API to get access token
 * 6. App launches HyperVerge SDK with token
 * 7. SDK executes workflow and returns result
 * 8. App displays appropriate result screen
 */
class MainActivity : ComponentActivity() {
    
    companion object {
        private const val TAG = "RbSdkTester"
    }
    
    // ============================================================================
    // HYPERVERGE SDK LAUNCHER
    // ============================================================================
    
    /**
     * HyperVerge SDK Activity Result Launcher
     * 
     * This launcher is used to start the HyperVerge SDK workflow and receive
     * the result when the workflow completes.
     */
    private lateinit var hyperKycLauncher: ActivityResultLauncher<HyperKycConfig>
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Restore persisted environment preference before building UI
        val prefs = getSharedPreferences("rb_sdk_tester_prefs", MODE_PRIVATE)
        val savedIsProduction = prefs.getBoolean("is_production", true)
        if (savedIsProduction) EnvironmentConfig.switchToProduction()
        else EnvironmentConfig.switchToDevelopment()

        // Register HyperVerge SDK launcher BEFORE setContent
        // This must be done before the activity is created
        registerHyperKycLauncher()
        
        setContent {
            RbAndroidSdkTesterTheme {
                MainApp()
            }
        }
    }
    
    /**
     * Register HyperVerge SDK Activity Result Launcher
     * 
     * Sets up the callback that handles the SDK workflow result.
     * This is called when the HyperVerge SDK workflow finishes.
     */
    private fun registerHyperKycLauncher() {
        hyperKycLauncher = registerForActivityResult(HyperKyc.Contract()) { result ->
            Log.d(TAG, "===============================================")
            Log.d(TAG, "HyperVerge SDK Result Received")
            Log.d(TAG, "===============================================")
            Log.d(TAG, "Status: ${result.status}")
            Log.d(TAG, "Transaction ID: ${result.transactionId}")
            Log.d(TAG, "Error Code: ${result.errorCode}")
            Log.d(TAG, "Error Message: ${result.errorMessage}")
            Log.d(TAG, "Latest Module: ${result.latestModule}")
            Log.d(TAG, "Details: ${result.details}")
            Log.d(TAG, "===============================================")
            
            // Convert SDK result to our internal data structure
            val sdkResult = SdkResult(
                status = result.status,
                transactionId = result.transactionId,
                errorCode = result.errorCode,
                errorMessage = result.errorMessage,
                latestModule = result.latestModule,
                details = result.details
            )
            
            // Handle result in UI (this is set from MainApp composable)
            handleSdkResult(sdkResult)
        }
    }
    
    // Callback to handle SDK result from composable
    private var handleSdkResult: (SdkResult) -> Unit = {}
    
    /**
     * Launch HyperVerge SDK with configuration
     * 
     * This is called from the composable UI when user wants to start verification.
     * 
     * @param config HyperKycConfig with access token, workflow ID, transaction ID
     */
    private fun launchHyperKyc(config: HyperKycConfig) {
        try {
            Log.d(TAG, "Launching HyperVerge SDK with configuration")
            
            // Launch the SDK
            hyperKycLauncher.launch(config)
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch HyperVerge SDK", e)
            Toast.makeText(
                this,
                "Failed to launch SDK: ${e.message}",
                Toast.LENGTH_LONG
            ).show()
        }
    }
    
    // ============================================================================
    // MAIN APP UI COMPOSABLE
    // ============================================================================
    
    @Composable
    fun MainApp() {
        // ========================================================================
        // STATE MANAGEMENT
        // ========================================================================
        
        // Current screen being displayed
        var currentScreen by remember { mutableStateOf<Screen>(Screen.Input) }
        
        // Environment state (synced with EnvironmentConfig)
        var isProduction by remember { mutableStateOf(EnvironmentConfig.isProduction) }
        var isCheckingEnv by remember { mutableStateOf(false) }

        // Mode selection (Default or Dynamic)
        var appMode by remember { mutableStateOf(AppMode.DEFAULT) }
        
        // Credentials for Dynamic mode
        var appId by remember { mutableStateOf("") }
        var appKey by remember { mutableStateOf("") }
        var workflowId by remember { mutableStateOf("") }
        
        // Workflow Inputs (key-value pairs for SDK initialization)
        var workflowInputs by remember { mutableStateOf(mutableListOf<WorkflowInput>()) }
        
        // Manual Name for Default mode
        var manualName by remember { mutableStateOf("") }
        
        // Transaction ID (generated by user)
        var transactionId by remember { mutableStateOf<String?>(null) }
        
        // Loading state
        var isGeneratingToken by remember { mutableStateOf(false) }
        
        // SDK result data
        var sdkResult by remember { mutableStateOf<SdkResult?>(null) }
        
        // Coroutine scope for API calls
        val coroutineScope = rememberCoroutineScope()

        // Webhook event subscription state (Dynamic mode only)
        var webhookEvents by remember { mutableStateOf(emptySet<String>()) }
        var isSubscribingWebhook by remember { mutableStateOf(false) }
        var webhookSubscriptionStatus by remember { mutableStateOf<String?>(null) }
        // Auto-derived receiver URL — always points to the currently active backend
        val webhookUrl = "${EnvironmentConfig.baseUrl.trimEnd('/')}/api/webhook/results"
        
        // ========================================================================
        // SDK RESULT HANDLER
        // ========================================================================
        
        // Set up the result handler callback
        LaunchedEffect(Unit) {
            handleSdkResult = { result ->
                sdkResult = result
                // Always go to the unified Results Dashboard regardless of status
                currentScreen = Screen.Results
            }
        }
        
        // ========================================================================
        // HELPER FUNCTIONS
        // ========================================================================
        
        /**
         * Switch environment with health check
         * Mirrors Flutter's switchEnvironment() in KycProvider
         */
        fun switchEnvironment(production: Boolean) {
            coroutineScope.launch {
                isCheckingEnv = true
                try {
                    // Apply the switch first so ApiClient rebuilds with the new URL
                    if (production) EnvironmentConfig.switchToProduction()
                    else EnvironmentConfig.switchToDevelopment()

                    // Health check on the new backend
                    val reachable = ApiClient.isBackendReachable()
                    if (reachable) {
                        isProduction = production
                        // Persist the choice so it survives app restarts
                        getSharedPreferences("rb_sdk_tester_prefs", MODE_PRIVATE)
                            .edit().putBoolean("is_production", production).apply()
                        Log.d(TAG, "Environment switched to: ${EnvironmentConfig.environmentName}")
                        Toast.makeText(
                            this@MainActivity,
                            "✅ Connected to ${EnvironmentConfig.environmentName}",
                            Toast.LENGTH_SHORT
                        ).show()
                    } else {
                        // Rollback
                        if (production) EnvironmentConfig.switchToDevelopment()
                        else EnvironmentConfig.switchToProduction()
                        Log.w(TAG, "Health check failed — reverting environment switch")
                        Toast.makeText(
                            this@MainActivity,
                            "⚠️ Backend unreachable — keeping ${EnvironmentConfig.environmentName}",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Environment switch error", e)
                    // Rollback on exception too
                    if (production) EnvironmentConfig.switchToDevelopment()
                    else EnvironmentConfig.switchToProduction()
                    Toast.makeText(
                        this@MainActivity,
                        "Error checking backend: ${e.message}",
                        Toast.LENGTH_LONG
                    ).show()
                } finally {
                    isCheckingEnv = false
                }
            }
        }

        /**
         * Generate a unique transaction ID
         * Format: txn_<timestamp>_<uuid>
         */
        fun generateTransactionId() {
            val timestamp = System.currentTimeMillis()
            val uuid = UUID.randomUUID().toString().take(8)
            transactionId = "txn_${timestamp}_$uuid"
            
            Log.d(TAG, "Generated Transaction ID: $transactionId")
            Toast.makeText(
                this@MainActivity,
                "Transaction ID generated",
                Toast.LENGTH_SHORT
            ).show()
        }
        
        /**
         * Initialize HyperVerge SDK workflow
         * 
         * Steps:
         * 1. Call backend API to generate access token
         * 2. Create HyperKycConfig with token
         * 3. Launch HyperVerge SDK
         */
        fun initializeWorkflow() {
            // Validate transaction ID exists
            if (transactionId == null) {
                Toast.makeText(
                    this@MainActivity,
                    "Please generate a transaction ID first",
                    Toast.LENGTH_SHORT
                ).show()
                return
            }
            
            // Validate credentials for Dynamic mode
            if (appMode == AppMode.DYNAMIC) {
                if (appId.isBlank() || appKey.isBlank() || workflowId.isBlank()) {
                    Toast.makeText(
                        this@MainActivity,
                        "Please fill all credential fields",
                        Toast.LENGTH_SHORT
                    ).show()
                    return
                }
            }
            
            isGeneratingToken = true
            
            coroutineScope.launch {
                try {
                    Log.d(TAG, "===========================================")
                    Log.d(TAG, "Starting Workflow Initialization")
                    Log.d(TAG, "===========================================")
                    Log.d(TAG, "Mode: ${appMode.toApiMode()}")
                    Log.d(TAG, "Transaction ID: $transactionId")
                    
                    // ============================================================
                    // STEP 1: Call Backend API to Generate Access Token
                    // ============================================================
                    
                    val tokenRequest = TokenRequest(
                        mode = appMode.toApiMode(),
                        transactionId = transactionId!!,
                        appId = if (appMode == AppMode.DYNAMIC) appId else null,
                        appKey = if (appMode == AppMode.DYNAMIC) appKey else null,
                        workflowId = if (appMode == AppMode.DYNAMIC) workflowId else null
                    )
                    
                    Log.d(TAG, "Calling backend API: ${BuildConfig.API_BASE_URL}")
                    
                    val response = ApiClient.apiService.generateAccessToken(tokenRequest)
                    
                    if (!response.isSuccessful) {
                        val errorBody = response.errorBody()?.string()
                        Log.e(TAG, "Backend API error: ${response.code()} - $errorBody")
                        throw Exception("Backend error: ${response.code()} - $errorBody")
                    }
                    
                    val tokenResponse = response.body()
                    if (tokenResponse == null || !tokenResponse.success) {
                        Log.e(TAG, "Invalid token response")
                        throw Exception("Failed to generate access token")
                    }
                    
                    Log.d(TAG, "Access token received successfully")
                    Log.d(TAG, "Workflow ID: ${tokenResponse.workflowId}")
                    
                    // ============================================================
                    // STEP 2: Create HyperKycConfig with Access Token
                    // ============================================================
                    
                    val hyperKycConfig = HyperKycConfig(
                        accessToken = tokenResponse.accessToken,
                        workflowId = tokenResponse.workflowId,
                        transactionId = tokenResponse.transactionId
                    ).apply {
                        // Set workflow inputs based on mode
                        if (appMode == AppMode.DEFAULT) {
                            // For Default mode, use manualName as MANUALNAME input
                            if (manualName.isNotBlank()) {
                                setInputs(hashMapOf("MANUALNAME" to manualName))
                                Log.d(TAG, "Default mode - Setting MANUALNAME: $manualName")
                            }
                        } else if (workflowInputs.isNotEmpty()) {
                            // For Dynamic mode, use custom workflow inputs
                            val inputsMap = hashMapOf<String, String>()
                            workflowInputs.forEach { input ->
                                if (input.key.isNotBlank()) {
                                    inputsMap[input.key] = input.value
                                }
                            }
                            if (inputsMap.isNotEmpty()) {
                                setInputs(inputsMap)
                                Log.d(TAG, "Dynamic mode - Workflow inputs set: $inputsMap")
                            }
                        }
                        
                        // Optional: Set location services
                        setUseLocation(false)
                        
                        // Optional: Set default language
                        setDefaultLangCode("en")
                        
                        // Optional: Set unique ID for CPR (Customer Persistent Record)
                        // setUniqueId("user_12345")
                    }
                    
                    Log.d(TAG, "HyperKycConfig created successfully")
                    
                    // ============================================================
                    // STEP 3: Launch HyperVerge SDK
                    // ============================================================
                    
                    isGeneratingToken = false
                    
                    // Launch SDK on main thread
                    launchHyperKyc(hyperKycConfig)
                    
                } catch (e: Exception) {
                    Log.e(TAG, "Workflow initialization failed", e)
                    isGeneratingToken = false
                    
                    // Show error to user
                    Toast.makeText(
                        this@MainActivity,
                        "Error: ${e.message}",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
        
        /**
         * Reset to input screen
         */
        fun resetToInput() {
            currentScreen = Screen.Input
            sdkResult = null
            webhookSubscriptionStatus = null
            // Note: We keep transactionId so user can regenerate if needed
        }

        /**
         * Subscribe to HyperVerge webhook events for the current dynamic account.
         *
         * @param create true  → POST (first-time creation)
         *               false → PUT  (update existing subscription)
         */
        fun subscribeWebhook(create: Boolean) {
            if (appMode != AppMode.DYNAMIC) return
            if (appId.isBlank() || appKey.isBlank()) {
                Toast.makeText(this@MainActivity, "Enter App ID and App Key first", Toast.LENGTH_SHORT).show()
                return
            }
            if (webhookEvents.isEmpty()) {
                Toast.makeText(this@MainActivity, "Select at least one event", Toast.LENGTH_SHORT).show()
                return
            }
            isSubscribingWebhook = true
            webhookSubscriptionStatus = null
            coroutineScope.launch {
                try {
                    val request = WebhookConfigRequest(
                        webhookUrl = webhookUrl,
                        events = webhookEvents.toList(),
                        appId = appId,
                        appKey = appKey
                    )
                    val resp = if (create)
                        ApiClient.apiService.createWebhookConfig(request)
                    else
                        ApiClient.apiService.updateWebhookConfig(request)

                    webhookSubscriptionStatus = if (resp.isSuccessful && resp.body()?.success == true) {
                        val action = if (create) "created" else "updated"
                        "✅ Webhook subscription $action successfully"
                    } else {
                        val errBody = resp.errorBody()?.string() ?: "HTTP ${resp.code()}"
                        "❌ Failed: $errBody"
                    }
                } catch (e: Exception) {
                    webhookSubscriptionStatus = "❌ Error: ${e.message}"
                } finally {
                    isSubscribingWebhook = false
                }
            }
        }
        
        // ========================================================================
        // UI RENDERING
        // ========================================================================
        
        Scaffold(
            modifier = Modifier.fillMaxSize()
        ) { paddingValues ->
            when (currentScreen) {
                // Main input screen
                Screen.Input -> {
                    InputScreen(
                        isProduction = isProduction,
                        onEnvironmentToggle = { switchEnvironment(it) },
                        isCheckingEnv = isCheckingEnv,
                        appMode = appMode,
                        onModeChange = { appMode = it },
                        appId = appId,
                        onAppIdChange = { appId = it },
                        appKey = appKey,
                        onAppKeyChange = { appKey = it },
                        workflowId = workflowId,
                        onWorkflowIdChange = { workflowId = it },
                        workflowInputs = workflowInputs,
                        onWorkflowInputsChange = { workflowInputs = it },
                        manualName = manualName,
                        onManualNameChange = { manualName = it },
                        transactionId = transactionId,
                        isGeneratingToken = isGeneratingToken,
                        onGenerateTransactionId = { generateTransactionId() },
                        // Webhook event subscription
                        webhookEvents = webhookEvents,
                        onWebhookEventsChange = { webhookEvents = it },
                        isSubscribingWebhook = isSubscribingWebhook,
                        webhookSubscriptionStatus = webhookSubscriptionStatus,
                        webhookUrl = webhookUrl,
                        onCreateWebhookSubscription = { subscribeWebhook(create = true) },
                        onUpdateWebhookSubscription = { subscribeWebhook(create = false) },
                        onInitializeWorkflow = { initializeWorkflow() }
                    )
                }

                // Unified Results Dashboard (all outcome types handled inside)
                Screen.Results -> {
                    sdkResult?.let { result ->
                        ResultsDashboardScreen(
                            sdkResult = result,
                            transactionId = result.transactionId ?: transactionId,
                            // Forward credentials for dynamic mode so Output API / Logs API
                            // calls reach HyperVerge with the correct account credentials.
                            appId = if (appMode == AppMode.DYNAMIC) appId.ifBlank { null } else null,
                            appKey = if (appMode == AppMode.DYNAMIC) appKey.ifBlank { null } else null,
                            onStartNewFlow = { resetToInput() }
                        )
                    }
                }
            }
        }
    }
    
    // ============================================================================
    // SCREEN NAVIGATION ENUM
    // ============================================================================
    
    /**
     * Screen enum for navigation
     */
    private sealed class Screen {
        object Input : Screen()
        object Results : Screen()
    }
}
