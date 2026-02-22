# HyperVerge SDK Integration - Technical Documentation

**Presenter**: Rohan Baiju - Integration Engineer  
**Project**: Android SDK Integration with HyperVerge KYC  
**Date**: February 2026  
**Version**: 1.0.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Dependencies & Setup](#dependencies--setup)
4. [Backend Implementation](#backend-implementation)
5. [Android App Implementation](#android-app-implementation)
6. [Code Execution Flow](#code-execution-flow)
7. [Integration Engineer Checklist](#integration-engineer-checklist)
8. [Testing & Validation](#testing--validation)
9. [Common Integration Issues](#common-integration-issues)

---

## 🎯 Overview

### What is HyperVerge?
HyperVerge provides AI-powered KYC (Know Your Customer) verification through mobile SDKs. The SDK captures documents, performs face verification, and validates identity in real-time.

### Implementation Approach
This implementation follows **HyperVerge's Recommended Integration Pattern**:
- ✅ **Backend Token Generation** (Secure - appId/appKey never exposed to client)
- ✅ **Short-lived Access Tokens** (1-24 hour expiry)
- ✅ **Transaction-based Architecture** (Each session has unique identifier)

### Project Structure
```
android_sdk_integration_hv/
├── backend/                      # Node.js Express server for token generation
│   └── index.js                  # Main backend logic (396 lines)
├── rb_android_sdk_tester/       # Android app (Kotlin + Jetpack Compose)
│   └── app/
│       ├── build.gradle.kts     # Dependencies & SDK configuration
│       └── src/main/java/com/rb/sdktester/
│           ├── MainActivity.kt   # Main activity with SDK integration (490 lines)
│           └── network/
│               ├── ApiClient.kt  # Retrofit singleton (121 lines)
│               ├── ApiService.kt # API interface (100 lines)
│               └── ApiModels.kt  # Request/response models (133 lines)
```

---

## 🏗️ Architecture

### High-Level Flow
```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│                 │         │                  │         │                  │
│  Android App    │────1───▶│  Your Backend    │────2───▶│  HyperVerge API  │
│  (Client)       │         │  (Node.js)       │         │  (Auth Server)   │
│                 │◀───4────│                  │◀───3────│                  │
└─────────────────┘         └──────────────────┘         └──────────────────┘
        │                                                          
        │                                                          
        │                    ┌──────────────────┐                 
        └──────────5────────▶│  HyperVerge SDK  │                 
                             │  (KYC Workflow)  │                 
                             └──────────────────┘                 
                                      │                            
                                      6                            
                                      ▼                            
                             ┌──────────────────┐                 
                             │  Result Screen   │                 
                             │  (Status/Data)   │                 
                             └──────────────────┘                 
```

### Data Flow Steps
1. **App → Backend**: Send credentials + transactionId
2. **Backend → HyperVerge**: Request access token with workflow config
3. **HyperVerge → Backend**: Return short-lived access token
4. **Backend → App**: Send access token + workflow details
5. **App → SDK**: Initialize SDK with token and launch verification
6. **SDK → App**: Return result (status, transactionId, details)

---

## 📦 Dependencies & Setup

### Backend Dependencies
**File**: [`backend/package.json`](backend/package.json)

```json
{
  "dependencies": {
    "express": "^4.18.2",      // Web server framework
    "cors": "^2.8.5",          // Cross-Origin Resource Sharing
    "axios": "^1.6.0",         // HTTP client for HyperVerge API calls
    "dotenv": "^16.3.1"        // Environment variable management
  }
}
```

**Why These Dependencies?**
- **Express**: Lightweight framework to create REST API endpoints
- **CORS**: Allows Android app to make cross-origin requests to backend
- **Axios**: Promise-based HTTP client with better error handling than native fetch
- **Dotenv**: Securely loads sensitive credentials from `.env` file

### Android Dependencies
**File**: [`rb_android_sdk_tester/gradle/libs.versions.toml`](rb_android_sdk_tester/gradle/libs.versions.toml#L1-L11)

```toml
[versions]
agp = "8.1.4"                  # Android Gradle Plugin
kotlin = "1.9.22"              # Kotlin language version
hyperkyc = "2.0.0"             # HyperVerge SDK version
retrofit = "2.9.0"             # HTTP client library
okhttp = "4.12.0"              # HTTP engine for Retrofit
```

**File**: [`rb_android_sdk_tester/app/build.gradle.kts`](rb_android_sdk_tester/app/build.gradle.kts#L88-L104)

```kotlin
dependencies {
    // HyperVerge SDK - The main SDK for KYC verification
    implementation(libs.hyperkyc) {
        isTransitive = true  // Include all SDK sub-dependencies
    }

    // Networking - Retrofit & OkHttp for backend API communication
    implementation(libs.retrofit)                      // REST API client
    implementation(libs.retrofit.converter.gson)       // JSON converter
    implementation(libs.okhttp)                        // HTTP engine
    implementation(libs.okhttp.logging.interceptor)    // Request/response logging

    // JSON parsing
    implementation(libs.gson)                          // JSON serialization
}
```

**Why These Dependencies?**
- **HyperKYC SDK 2.0.0**: Core SDK for document capture, face verification, liveness detection
- **Retrofit**: Type-safe HTTP client that simplifies API calls with coroutines support
- **OkHttp**: Underlying HTTP engine with connection pooling, caching, interceptors
- **Gson**: Converts JSON responses to Kotlin data classes automatically

### Android Permissions
**File**: [`rb_android_sdk_tester/app/src/main/AndroidManifest.xml`](rb_android_sdk_tester/app/src/main/AndroidManifest.xml#L5-L17)

```xml
<!-- REQUIRED PERMISSIONS -->
<uses-permission android:name="android.permission.INTERNET" />           <!-- Line 6 -->
<uses-permission android:name="android.permission.CAMERA" />            <!-- Line 10 -->

<!-- OPTIONAL PERMISSIONS (based on workflow) -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />    <!-- Line 13 -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />            <!-- Line 16 -->
```

**Permission Rationale**:
- **INTERNET**: ✅ **Required** - Backend API calls, SDK upload
- **CAMERA**: ✅ **Required** - Document/face capture
- **LOCATION**: ⚠️ **Optional** - Geo-tagging if workflow needs it
- **RECORD_AUDIO**: ⚠️ **Optional** - Video-based liveness detection

**Important**: Handle runtime permissions (Android 6.0+) before launching SDK.

---

## 🔧 Backend Implementation

### File Overview
**File**: [`backend/index.js`](backend/index.js) (396 lines)

### Key Configuration
**Lines 43-56**: Environment Variables & Constants
```javascript
// HyperVerge API endpoint (Recommended Method - v2 Auth API)
const HYPERVERGE_AUTH_URL = process.env.HYPERVERGE_AUTH_URL || 
                            'https://ind-state.idv.hyperverge.co/v2/auth/token';

// Default credentials from environment variables
const DEFAULT_CREDENTIALS = {
  appId: process.env.DEFAULT_APP_ID,        // Example: "c52h5j"
  appKey: process.env.DEFAULT_APP_KEY,      // Example: "HV:q7aqkdhe5b39vfmeg"
  workflowId: process.env.DEFAULT_WORKFLOW_ID  // Example: "rb_sureguard_insurance"
};
```

**Integration Note**: Set these in `.env` file or hosting platform (Vercel environment variables).

### Main Token Generation Endpoint

#### Line-by-Line Code Flow

**Lines 141-143**: Endpoint Declaration
```javascript
app.post('/api/generate-access-token', async (req, res) => {
  try {
    const { mode, transactionId, appId, appKey, workflowId } = req.body;
```
- **HTTP Method**: POST
- **URL**: `/api/generate-access-token`
- **Purpose**: Generate HyperVerge access token for SDK initialization

---

**Lines 148-165**: Request Validation
```javascript
// Validate mode (must be 'default' or 'dynamic')
if (!mode || (mode !== 'default' && mode !== 'dynamic')) {
  return res.status(400).json({
    success: false,
    error: 'Invalid mode',
    code: 'INVALID_MODE'
  });
}

// Validate transaction ID exists
if (!transactionId || typeof transactionId !== 'string') {
  return res.status(400).json({
    success: false,
    error: 'Missing transaction ID',
    code: 'MISSING_TRANSACTION_ID'
  });
}
```
- **Why**: Prevents malformed requests reaching HyperVerge API
- **Expected Format**: `transactionId: "txn_1739923200_abc123xyz"`

---

**Lines 175-190**: Mode-Based Credential Selection
```javascript
if (mode === 'default') {
  // DEFAULT MODE: Use backend environment variables
  if (!DEFAULT_CREDENTIALS.appId || !DEFAULT_CREDENTIALS.appKey) {
    return res.status(500).json({
      error: 'Default credentials not configured',
      code: 'DEFAULT_CREDENTIALS_NOT_CONFIGURED'
    });
  }
  
  finalAppId = DEFAULT_CREDENTIALS.appId;
  finalAppKey = DEFAULT_CREDENTIALS.appKey;
  finalWorkflowId = DEFAULT_CREDENTIALS.workflowId;
}
```
- **Default Mode**: Uses pre-configured credentials from `.env`
- **Use Case**: Testing, internal apps, single workflow

---

**Lines 191-240**: Dynamic Mode Credential Validation
```javascript
else if (mode === 'dynamic') {
  // DYNAMIC MODE: Use credentials from request body
  if (!appId || !appKey || !workflowId) {
    return res.status(400).json({
      error: 'Missing credentials',
      code: 'MISSING_DYNAMIC_CREDENTIALS'
    });
  }
  
  finalAppId = appId.trim();
  finalAppKey = appKey.trim();
  finalWorkflowId = workflowId.trim();
}
```
- **Dynamic Mode**: Accepts credentials in each request
- **Use Case**: Multi-tenant apps, different workflows per user

---

**Lines 250-260**: HyperVerge API Request (CRITICAL SECTION)
```javascript
const hypervergePayload = {
  appId: finalAppId,
  appKey: finalAppKey,
  transactionId: transactionId,
  workflowId: finalWorkflowId,
  expiry: 43200  // 12 hours (default), max: 86400 (24 hours)
};

const hypervergeResponse = await axios.post(
  HYPERVERGE_AUTH_URL,  // 'https://ind-state.idv.hyperverge.co/v2/auth/token'
  hypervergePayload,
  {
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000  // 10 second timeout
  }
);
```
- **API Version**: v2 (Recommended - supports workflowId & expiry)
- **Expiry**: `43200` seconds = 12 hours (adjust based on needs)
- **Region**: `ind-state.idv.hyperverge.co` (India region)

**Integration Tip**: Use appropriate region endpoint:
- India: `https://ind-state.idv.hyperverge.co`
- APAC: `https://apac-state.idv.hyperverge.co`
- US: `https://us-state.idv.hyperverge.co`

---

**Lines 283-296**: Extract Access Token from Response
```javascript
// HyperVerge API response structure: { "result": { "authToken": "..." } }
const accessToken = hypervergeData.result?.authToken || 
                   hypervergeData.result?.token || 
                   hypervergeData.token || 
                   hypervergeData.accessToken;

if (!accessToken) {
  console.error('[HyperVerge API] No access token in response:', hypervergeData);
  throw new Error('Access token not found in HyperVerge API response');
}
```
- **Response Structure**: Nested under `result.authToken`
- **Fallback Logic**: Handles different API response formats

---

**Lines 303-317**: Send Success Response to Android App
```javascript
res.json({
  success: true,
  accessToken: accessToken,         // Short-lived JWT token
  workflowId: finalWorkflowId,      // Workflow to execute in SDK
  transactionId: transactionId,     // Echo back for verification
  mode: mode,                       // default or dynamic
  expiresIn: 43200,                 // Token validity (seconds)
  timestamp: new Date().toISOString()
});
```
- **Access Token**: Use this in `HyperKycConfig` on Android
- **Workflow ID**: Must match the workflow configured in HyperVerge dashboard

---

## 📱 Android App Implementation

### File Structure
```
MainActivity.kt           # Main activity with SDK integration (490 lines)
network/
├── ApiClient.kt         # Retrofit singleton (121 lines)
├── ApiService.kt        # API endpoints interface (100 lines)
└── ApiModels.kt         # Request/response data classes (133 lines)
```

---

### 1. Network Layer Setup

#### ApiClient.kt - HTTP Client Configuration
**File**: [`network/ApiClient.kt`](rb_android_sdk_tester/app/src/main/java/com/rb/sdktester/network/ApiClient.kt)

**Lines 24-29**: Base URL Configuration
```kotlin
private val BASE_URL: String
    get() = BuildConfig.API_BASE_URL
```
- **Source**: `app/build.gradle.kts` line 27
- **Debug**: `http://192.168.0.101:3000` (local WiFi)
- **Release**: `https://your-app.vercel.app` (production)

**Lines 50-58**: OkHttp Client with Timeouts
```kotlin
private val okHttpClient = OkHttpClient.Builder()
    .connectTimeout(30, TimeUnit.SECONDS)   // Connection establishment timeout
    .readTimeout(30, TimeUnit.SECONDS)      // Reading response timeout
    .writeTimeout(30, TimeUnit.SECONDS)     // Writing request timeout
    .addInterceptor(loggingInterceptor)     // Logs HTTP requests in debug mode
    .build()
```
- **Why Timeouts?**: Prevents app hanging on slow/dead connections
- **30 seconds**: Reasonable for token generation (HyperVerge API responds in ~2-3s)

**Lines 69-73**: Retrofit Instance
```kotlin
private val retrofit: Retrofit = Retrofit.Builder()
    .baseUrl(ensureTrailingSlash(BASE_URL))
    .addConverterFactory(GsonConverterFactory.create())  // JSON parsing
    .client(okHttpClient)
    .build()
```
- **Gson Converter**: Auto-converts JSON to `TokenResponse` data class

---

#### ApiService.kt - API Endpoint Interface
**File**: [`network/ApiService.kt`](rb_android_sdk_tester/app/src/main/java/com/rb/sdktester/network/ApiService.kt)

**Lines 63-67**: Token Generation Endpoint
```kotlin
@POST("api/generate-access-token")
suspend fun generateAccessToken(
    @Body request: TokenRequest
): Response<TokenResponse>
```
- **HTTP Method**: POST
- **Endpoint**: `api/generate-access-token`
- **Suspend**: Runs asynchronously with Kotlin coroutines
- **Returns**: `Response<TokenResponse>` with access token or error

---

#### ApiModels.kt - Request/Response Data Classes
**File**: [`network/ApiModels.kt`](rb_android_sdk_tester/app/src/main/java/com/rb/sdktester/network/ApiModels.kt)

**Lines 10-47**: TokenRequest Data Class
```kotlin
data class TokenRequest(
    @SerializedName("mode")           val mode: String,          // "default" or "dynamic"
    @SerializedName("transactionId")  val transactionId: String, // "txn_1739923200_abc"
    @SerializedName("appId")          val appId: String? = null, // Dynamic mode only
    @SerializedName("appKey")         val appKey: String? = null,
    @SerializedName("workflowId")     val workflowId: String? = null
)
```
- **@SerializedName**: Maps Kotlin property to JSON field name
- **Nullable Fields**: Only required for dynamic mode

**Lines 52-88**: TokenResponse Data Class
```kotlin
data class TokenResponse(
    @SerializedName("success")        val success: Boolean,
    @SerializedName("accessToken")    val accessToken: String,    // Use in HyperKycConfig
    @SerializedName("workflowId")     val workflowId: String,     // Use in HyperKycConfig
    @SerializedName("transactionId")  val transactionId: String,  // Use in HyperKycConfig
    @SerializedName("mode")           val mode: String,
    @SerializedName("expiresIn")      val expiresIn: Int,         // 43200 = 12 hours
    @SerializedName("timestamp")      val timestamp: String
)
```
- **These 3 fields are critical**: `accessToken`, `workflowId`, `transactionId`

---

### 2. MainActivity.kt - SDK Integration

**File**: [`MainActivity.kt`](rb_android_sdk_tester/app/src/main/java/com/rb/sdktester/MainActivity.kt) (490 lines)

#### Section A: Data Models (Lines 1-35)

**Lines 28-36**: SdkResult Data Class
```kotlin
data class SdkResult(
    val status: String,           // "auto_approved", "auto_declined", etc.
    val transactionId: String?,   // Unique ID for this verification
    val errorCode: Int?,          // Error code if failed
    val errorMessage: String?,    // Error description
    val latestModule: String?,    // Last module user interacted with
    val details: Map<String, String>  // Additional result data
)
```
- **Purpose**: Wrapper for HyperVerge SDK result
- **Why?**: `HyperKycResult` class not directly accessible in SDK 2.0.0

---

#### Section B: SDK Launcher Registration (Lines 75-89)

**Lines 82-89**: Register HyperVerge Activity Result Launcher
```kotlin
private fun registerHyperKycLauncher() {
    hyperKycLauncher = registerForActivityResult(HyperKyc.Contract()) { result ->
        Log.d(TAG, "HyperVerge SDK Result Received")
        Log.d(TAG, "Status: ${result.status}")
        Log.d(TAG, "Transaction ID: ${result.transactionId}")
        
        // Convert SDK result to our internal data structure
        val sdkResult = SdkResult(
            status = result.status,
            transactionId = result.transactionId,
            errorCode = result.errorCode,
            errorMessage = result.errorMessage,
            latestModule = result.latestModule,
            details = result.details
        )
        
        // Handle result in UI
        handleSdkResult(sdkResult)
    }
}
```
- **When Called**: Executed in `onCreate()` before `setContent()`
- **Contract**: `HyperKyc.Contract()` - SDK's activity result contract
- **Callback**: Invoked when SDK workflow finishes
- **Result Object**: Contains status, transactionId, error info, custom details

**⚠️ CRITICAL**: This MUST be registered before activity is created. Don't call inside composables!

---

#### Section C: Launch SDK (Lines 134-152)

**Lines 134-152**: Launch HyperVerge SDK Function
```kotlin
private fun launchHyperKyc(config: HyperKycConfig) {
    try {
        Log.d(TAG, "Launching HyperVerge SDK with configuration")
        
        // Launch the SDK with configuration
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
```
- **Parameter**: `HyperKycConfig` (created in next section)
- **Action**: Opens HyperVerge SDK UI overlay
- **Error Handling**: Catches initialization failures

---

#### Section D: Workflow Initialization (Lines 243-387)

**Lines 243-270**: Transaction ID Generation
```kotlin
fun generateTransactionId() {
    val timestamp = System.currentTimeMillis()       // 1739923200000
    val uuid = UUID.randomUUID().toString().take(8)  // "abc123xyz"
    transactionId = "txn_${timestamp}_$uuid"         // "txn_1739923200000_abc123xyz"
    
    Log.d(TAG, "Generated Transaction ID: $transactionId")
    Toast.makeText(
        this@MainActivity,
        "Transaction ID generated",
        Toast.LENGTH_SHORT
    ).show()
}
```
- **Format**: `txn_<timestamp>_<shortUUID>`
- **Purpose**: Unique identifier for this verification session
- **Used**: For backend token request and SDK configuration

---

**Lines 276-387**: Complete Workflow Initialization
```kotlin
fun initializeWorkflow() {
    // 1️⃣ VALIDATE TRANSACTION ID
    if (transactionId == null) {
        Toast.makeText(this@MainActivity, "Please generate a transaction ID first", Toast.LENGTH_SHORT).show()
        return
    }
    
    // 2️⃣ VALIDATE CREDENTIALS (Dynamic Mode)
    if (appMode == AppMode.DYNAMIC) {
        if (appId.isBlank() || appKey.isBlank() || workflowId.isBlank()) {
            Toast.makeText(this@MainActivity, "Please fill all credential fields", Toast.LENGTH_SHORT).show()
            return
        }
    }
    
    isGeneratingToken = true
    
    coroutineScope.launch {
        try {
            // 3️⃣ CREATE TOKEN REQUEST
            val tokenRequest = TokenRequest(
                mode = appMode.toApiMode(),              // "default" or "dynamic"
                transactionId = transactionId!!,
                appId = if (appMode == AppMode.DYNAMIC) appId else null,
                appKey = if (appMode == AppMode.DYNAMIC) appKey else null,
                workflowId = if (appMode == AppMode.DYNAMIC) workflowId else null
            )
            
            Log.d(TAG, "Calling backend API: ${BuildConfig.API_BASE_URL}")
            
            // 4️⃣ CALL BACKEND API (Lines 305-310)
            val response = ApiClient.apiService.generateAccessToken(tokenRequest)
            
            if (!response.isSuccessful) {
                val errorBody = response.errorBody()?.string()
                throw Exception("Backend error: ${response.code()} - $errorBody")
            }
            
            val tokenResponse = response.body()
            if (tokenResponse == null || !tokenResponse.success) {
                throw Exception("Failed to generate access token")
            }
            
            Log.d(TAG, "Access token received successfully")
            
            // 5️⃣ CREATE HYPERKYC CONFIG (Lines 327-360)
            val hyperKycConfig = HyperKycConfig(
                accessToken = tokenResponse.accessToken,      // FROM BACKEND
                workflowId = tokenResponse.workflowId,        // FROM BACKEND
                transactionId = tokenResponse.transactionId   // FROM BACKEND
            ).apply {
                // Set workflow inputs based on mode
                if (appMode == AppMode.DEFAULT) {
                    // Default mode: MANUALNAME input
                    if (manualName.isNotBlank()) {
                        setInputs(hashMapOf("MANUALNAME" to manualName))
                    }
                } else if (workflowInputs.isNotEmpty()) {
                    // Dynamic mode: Custom workflow inputs
                    val inputsMap = hashMapOf<String, String>()
                    workflowInputs.forEach { (key, value) ->
                        if (key.isNotBlank()) {
                            inputsMap[key] = value
                        }
                    }
                    if (inputsMap.isNotEmpty()) {
                        setInputs(inputsMap)
                    }
                }
                
                // Optional: Configure SDK settings
                setUseLocation(false)           // Disable location tracking
                setDefaultLangCode("en")        // Set UI language
                // setUniqueId("user_12345")    // CPR unique ID (optional)
            }
            
            isGeneratingToken = false
            
            // 6️⃣ LAUNCH HYPERVERGE SDK (Line 371)
            launchHyperKyc(hyperKycConfig)
            
        } catch (e: Exception) {
            Log.e(TAG, "Workflow initialization failed", e)
            isGeneratingToken = false
            Toast.makeText(this@MainActivity, "Error: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
}
```

**Execution Breakdown**:
1. **Line 278**: Validate transactionId exists
2. **Line 286**: Validate credentials for dynamic mode
3. **Line 295**: Create `TokenRequest` with mode & credentials
4. **Line 305**: Call backend API via Retrofit (network request)
5. **Line 327**: Create `HyperKycConfig` with received token
6. **Line 342**: Set workflow inputs (MANUALNAME or custom key-value pairs)
7. **Line 356**: Configure optional SDK settings (location, language)
8. **Line 371**: Launch HyperVerge SDK with config

---

#### Section E: Result Handling (Lines 210-224)

**Lines 210-224**: SDK Result Handler
```kotlin
LaunchedEffect(Unit) {
    handleSdkResult = { result ->
        sdkResult = result
        
        // Navigate to appropriate result screen based on status
        currentScreen = when (SdkResultStatus.fromString(result.status)) {
            SdkResultStatus.AUTO_APPROVED -> Screen.AutoApproved     // KYC passed
            SdkResultStatus.AUTO_DECLINED -> Screen.AutoDeclined     // KYC failed
            SdkResultStatus.NEEDS_REVIEW  -> Screen.NeedsReview      // Manual review needed
            SdkResultStatus.USER_CANCELLED -> Screen.UserCancelled   // User exited SDK
            SdkResultStatus.ERROR         -> Screen.Error            // SDK error occurred
        }
    }
}
```
- **Callback**: Set in `LaunchedEffect` (runs once)
- **Triggered**: When SDK workflow completes (success or failure)
- **Action**: Updates UI to show appropriate result screen

**Result Status Values**:
- ✅ `auto_approved`: Verification passed all checks
- ❌ `auto_declined`: Verification failed (document invalid, face mismatch, etc.)
- ⏳ `needs_review`: Requires manual review by operations team
- 🚪 `user_cancelled`: User closed SDK mid-workflow
- ⚠️ `error`: Technical error (network, permissions, SDK issue)

---

## 🔄 Code Execution Flow

### Complete Flow with Line References

#### **Step 1: User Opens App**
1. `MainActivity.onCreate()` - Line 81
2. `registerHyperKycLauncher()` - Line 97 (registers SDK result callback)
3. `setContent { MainApp() }` - Line 89 (renders UI)

---

#### **Step 2: User Generates Transaction ID**
1. User clicks "Generate Transaction ID" button
2. `generateTransactionId()` - Line 243
3. Transaction ID created: `"txn_1739923200000_abc123xyz"`
4. Transaction ID displayed in UI

---

#### **Step 3: User Enters Credentials (Dynamic Mode Only)**
1. User enters AppID, AppKey, WorkflowID in text fields
2. State variables updated: `appId`, `appKey`, `workflowId`

---

#### **Step 4: User Clicks "Initialize Workflow"**
1. `initializeWorkflow()` - Line 276
2. Validation checks (Lines 278-292):
   - ✅ Transaction ID exists?
   - ✅ Credentials filled (dynamic mode)?
3. Create `TokenRequest` - Line 295
4. Backend API call - Line 305:
   ```
   POST http://192.168.0.101:3000/api/generate-access-token
   Body: {
     "mode": "default",
     "transactionId": "txn_1739923200000_abc123xyz"
   }
   ```

---

#### **Step 5: Backend Processes Request**
1. **Backend**: `app.post('/api/generate-access-token')` - Line 141
2. **Backend**: Validate request - Lines 148-165
3. **Backend**: Select credentials based on mode - Lines 175-240
4. **Backend**: Call HyperVerge Auth API - Lines 250-260:
   ```
   POST https://ind-state.idv.hyperverge.co/v2/auth/token
   Body: {
     "appId": "c52h5j",
     "appKey": "HV:q7aqkdhe5b39vfmeg",
     "transactionId": "txn_1739923200000_abc123xyz",
     "workflowId": "rb_sureguard_insurance",
     "expiry": 43200
   }
   ```
5. **HyperVerge API**: Returns access token
6. **Backend**: Extract token - Line 283
7. **Backend**: Send response to app - Line 303:
   ```json
   {
     "success": true,
     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "workflowId": "rb_sureguard_insurance",
     "transactionId": "txn_1739923200000_abc123xyz",
     "expiresIn": 43200
   }
   ```

---

#### **Step 6: App Creates HyperKycConfig**
1. **Android**: Receive `TokenResponse` - Line 313
2. **Android**: Create `HyperKycConfig` - Line 327:
   ```kotlin
   val config = HyperKycConfig(
       accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       workflowId = "rb_sureguard_insurance",
       transactionId = "txn_1739923200000_abc123xyz"
   )
   ```
3. **Android**: Apply workflow inputs - Lines 342-355
4. **Android**: Set SDK options - Lines 357-361

---

#### **Step 7: Launch HyperVerge SDK**
1. **Android**: `launchHyperKyc(config)` - Line 371
2. **Android**: `hyperKycLauncher.launch(config)` - Line 138
3. **SDK Opens**: Full-screen overlay appears
4. **User Interaction**: Document capture, face capture, liveness check
5. **SDK Processing**: AI analysis, verification logic

---

#### **Step 8: SDK Returns Result**
1. **SDK**: Workflow completes (success or failure)
2. **Android**: Result callback triggered - Line 97:
   ```kotlin
   registerForActivityResult(HyperKyc.Contract()) { result ->
       // result.status = "auto_approved"
       // result.transactionId = "txn_1739923200000_abc123xyz"
       // result.details = { "faceMatch": "98.5", "docType": "PAN" }
   }
   ```
3. **Android**: Convert to `SdkResult` - Line 107
4. **Android**: Call `handleSdkResult(sdkResult)` - Line 116

---

#### **Step 9: Display Result Screen**
1. **Android**: `handleSdkResult` executes - Line 211
2. **Android**: Determine screen based on status - Line 215:
   ```kotlin
   when (result.status) {
       "auto_approved"   -> Screen.AutoApproved
       "auto_declined"   -> Screen.AutoDeclined
       "needs_review"    -> Screen.NeedsReview
       "user_cancelled"  -> Screen.UserCancelled
       "error"           -> Screen.Error
   }
   ```
3. **Android**: Update `currentScreen` state
4. **UI**: Recompose and show result screen with details

---

## ✅ Integration Engineer Checklist

### Pre-Integration Checklist

#### 1. HyperVerge Account Setup
- [ ] **Obtain Credentials**: Get AppID, AppKey from HyperVerge dashboard
- [ ] **Create Workflow**: Configure workflow in HyperVerge portal
- [ ] **Note Workflow ID**: Copy exact workflow ID string
- [ ] **Check Region**: Confirm API endpoint (India/APAC/US)
- [ ] **IP Whitelist**: Add backend server IP to HyperVerge whitelist
  - For Vercel: Contact HyperVerge to whitelist AWS IP ranges
  - For local: Find IP via `curl https://api.ipify.org` and whitelist it

#### 2. Backend Environment Setup
- [ ] **Create `.env` file**:
  ```bash
  DEFAULT_APP_ID=your_app_id
  DEFAULT_APP_KEY=your_app_key
  DEFAULT_WORKFLOW_ID=your_workflow_id
  HYPERVERGE_AUTH_URL=https://ind-state.idv.hyperverge.co/v2/auth/token
  ```
- [ ] **Install Dependencies**: `npm install`
- [ ] **Test Locally**: `npm start` and verify `http://localhost:3000/health`
- [ ] **Deploy Backend**: Vercel, AWS, or your hosting platform
- [ ] **Set Environment Variables**: In hosting platform dashboard

#### 3. Android Project Setup
- [ ] **Add HyperKYC SDK**: `implementation("co.hyperverge:hyperkyc:2.0.0")`
- [ ] **Add Networking Libraries**: Retrofit, OkHttp, Gson
- [ ] **Configure Backend URL**: Update `API_BASE_URL` in `app/build.gradle.kts`
  - Debug: `http://YOUR_LOCAL_IP:3000` or ngrok URL
  - Release: `https://your-backend.vercel.app`
- [ ] **Add Permissions**: `INTERNET`, `CAMERA` in AndroidManifest.xml
- [ ] **Handle Runtime Permissions**: Request camera permission before SDK launch
- [ ] **Enable BuildConfig**: Set `buildFeatures.buildConfig = true`

---

### During Integration - Code Review Points

#### Backend Validation
- [ ] **Endpoint Accessible**: Test with Postman/curl
  ```bash
  curl -X POST http://localhost:3000/api/generate-access-token \
       -H "Content-Type: application/json" \
       -d '{"mode":"default","transactionId":"test_123"}'
  ```
- [ ] **Success Response**: Check `accessToken` field exists
- [ ] **Error Handling**: Test invalid mode, missing transactionId
- [ ] **CORS Configured**: App can make cross-origin requests
- [ ] **Timeout Settings**: 10-second timeout for HyperVerge API call
- [ ] **Logging**: Console logs show request/response flow

#### Android App Validation
- [ ] **SDK Launcher Registered**: `registerForActivityResult()` called in `onCreate()`
- [ ] **Retrofit Client Working**: Test health check endpoint first
- [ ] **BuildConfig Available**: `BuildConfig.API_BASE_URL` resolves correctly
- [ ] **Logging Enabled**: HTTP logging interceptor shows API calls
- [ ] **Coroutine Scope**: API calls inside `coroutineScope.launch {}`
- [ ] **Error Handling**: Try-catch blocks around API calls and SDK launch
- [ ] **Result Callback**: `handleSdkResult` properly updates UI

---

### Critical Integration Points to Verify

#### 1. Token Generation Flow
```
Android App ────[1]───▶ Your Backend ────[2]───▶ HyperVerge API
    │                       │                         │
    │                       │                         │
    │                       └────[3]◀──────────────┘
    │                       (Access Token)
    │                       
    └────[4]◀──────────────┘
    (Token + Workflow ID)
```

**Verify**:
- [ ] Step 1: Request reaches backend with correct JSON format
- [ ] Step 2: Backend calls HyperVerge with valid credentials
- [ ] Step 3: HyperVerge returns token (not error)
- [ ] Step 4: App receives token and stores in `HyperKycConfig`

#### 2. SDK Initialization
**Check Lines**:
- [ ] `HyperKycConfig` created with: `accessToken`, `workflowId`, `transactionId`
- [ ] `setInputs()` called if workflow requires inputs (e.g., MANUALNAME)
- [ ] Optional configs set: `setUseLocation()`, `setDefaultLangCode()`
- [ ] `hyperKycLauncher.launch(config)` executes without exception

#### 3. Result Handling
**Verify All Status Paths**:
- [ ] `auto_approved`: Shows success screen with transaction ID
- [ ] `auto_declined`: Shows decline reason and error code
- [ ] `needs_review`: Shows "under review" message
- [ ] `user_cancelled`: Shows "cancelled" with last module name
- [ ] `error`: Shows error message and allows retry

---

### Post-Integration Testing

#### Functional Testing
- [ ] **Default Mode Test**: Use backend credentials successfully
- [ ] **Dynamic Mode Test**: Enter custom credentials successfully
- [ ] **Transaction ID**: Generated in correct format
- [ ] **Workflow Inputs**: MANUALNAME (default) or custom key-value pairs
- [ ] **SDK Launch**: Opens full-screen HyperVerge UI
- [ ] **Document Capture**: Can capture Aadhaar/PAN/License
- [ ] **Face Capture**: Can capture face with liveness detection
- [ ] **Result Screen**: Shows correct status after workflow

#### Error Scenario Testing
- [ ] **Backend Offline**: Shows "connection error" toast
- [ ] **Invalid Credentials**: Backend returns 400 error
- [ ] **No Transaction ID**: Shows "generate transaction ID first" message
- [ ] **Permission Denied**: Camera permission not granted
- [ ] **Network Timeout**: API call times out after 30 seconds
- [ ] **SDK Error**: Shows error screen with code/message

#### Performance Testing
- [ ] **Token Generation Time**: < 5 seconds in normal conditions
- [ ] **SDK Launch Time**: < 2 seconds after token received
- [ ] **Memory Usage**: No memory leaks after multiple SDK launches
- [ ] **App Size**: Check APK size (HyperKYC SDK adds ~40-50 MB)

---

### Common Integration Mistakes to Avoid

#### ❌ **Mistake 1**: Registering SDK Launcher Inside Composable
```kotlin
// WRONG - Will crash!
@Composable
fun MyScreen() {
    val launcher = registerForActivityResult(HyperKyc.Contract()) { }
}
```
✅ **Correct**: Register in `onCreate()` before `setContent()`

#### ❌ **Mistake 2**: Exposing AppId/AppKey in Android App
```kotlin
// WRONG - Security risk!
val config = HyperKycConfig(
    appId = "c52h5j",
    appKey = "HV:q7aqkdhe5b39vfmeg"
)
```
✅ **Correct**: Use access token from backend

#### ❌ **Mistake 3**: Not Handling Runtime Permissions
```kotlin
// WRONG - SDK will fail if camera permission not granted
launchHyperKyc(config)
```
✅ **Correct**: Check/request camera permission first

#### ❌ **Mistake 4**: Using Wrong API Endpoint
```kotlin
// WRONG - Old API (deprecated)
"https://ind.hyperverge.co/v1/auth"
```
✅ **Correct**: Use v2 API with workflowId support
```kotlin
"https://ind-state.idv.hyperverge.co/v2/auth/token"
```

#### ❌ **Mistake 5**: Not Validating Transaction ID Uniqueness
```kotlin
// WRONG - Reusing same transaction ID
val transactionId = "test_123"  // Same for every user!
```
✅ **Correct**: Generate unique ID per session
```kotlin
val transactionId = "txn_${System.currentTimeMillis}_${UUID.randomUUID()}"
```

---

## 🧪 Testing & Validation

### Backend Testing

#### 1. Health Check
```bash
curl http://localhost:3000/health
# Expected: {"status":"healthy","timestamp":"..."}
```

#### 2. Default Mode Token Generation
```bash
curl -X POST http://localhost:3000/api/generate-access-token \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "default",
    "transactionId": "txn_test_001"
  }'

# Expected Response:
# {
#   "success": true,
#   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "workflowId": "rb_sureguard_insurance",
#   "transactionId": "txn_test_001",
#   "expiresIn": 43200
# }
```

#### 3. Dynamic Mode Token Generation
```bash
curl -X POST http://localhost:3000/api/generate-access-token \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "dynamic",
    "transactionId": "txn_test_002",
    "appId": "c52h5j",
    "appKey": "HV:q7aqkdhe5b39vfmeg",
    "workflowId": "rb_sureguard_insurance"
  }'
```

#### 4. Error Cases
```bash
# Missing transaction ID
curl -X POST http://localhost:3000/api/generate-access-token \
  -H "Content-Type: application/json" \
  -d '{"mode": "default"}'
# Expected: 400 error with code "MISSING_TRANSACTION_ID"

# Invalid mode
curl -X POST http://localhost:3000/api/generate-access-token \
  -H "Content-Type: application/json" \
  -d '{"mode": "invalid", "transactionId": "test_123"}'
# Expected: 400 error with code "INVALID_MODE"
```

---

### Android App Testing

#### Debug Logging
Enable HTTP logging to see API requests:
```kotlin
// In ApiClient.kt - Line 38-44
private val loggingInterceptor = HttpLoggingInterceptor().apply {
    level = HttpLoggingInterceptor.Level.BODY  // Shows full request/response
}
```

**Logcat Filters**:
```
Tag: RbSdkTester          # App-specific logs
Tag: OkHttp               # HTTP requests/responses
Tag: HyperVerge           # SDK internal logs
```

#### Test Cases

**Test 1: Default Mode - Happy Path**
1. Open app
2. Select "Default" mode
3. Click "Generate Transaction ID"
4. Click "Initialize Workflow"
5. ✅ Expect: SDK opens, workflow completes, result screen shows

**Test 2: Dynamic Mode - Custom Credentials**
1. Select "Dynamic" mode
2. Enter AppID, AppKey, WorkflowID
3. Generate transaction ID
4. Initialize workflow
5. ✅ Expect: Token generated with custom credentials

**Test 3: Network Error Handling**
1. Turn off WiFi/mobile data
2. Try initializing workflow
3. ✅ Expect: Toast shows "Network error" or "Failed to connect"

**Test 4: Workflow Inputs**
1. Default mode: Enter name in "Manual Name" field
2. Dynamic mode: Add custom key-value pairs (e.g., `EMAIL → test@example.com`)
3. Initialize workflow
4. ✅ Expect: Inputs passed to SDK, visible in result details

---

## 🚨 Common Integration Issues

### Issue 1: Backend Returns 401 Unauthorized
**Symptoms**:
- Backend logs: `HyperVerge API returned status 401`
- App shows: "Failed to generate access token"

**Causes**:
- ❌ Invalid AppID or AppKey
- ❌ Credentials expired or revoked
- ❌ Backend IP not whitelisted in HyperVerge

**Solutions**:
1. Verify credentials in `.env` file match HyperVerge dashboard
2. Check credentials haven't expired (contact HyperVerge)
3. Whitelist backend server IP in HyperVerge portal
4. For Vercel: Contact HyperVerge to whitelist AWS IP ranges

---

### Issue 2: SDK Doesn't Launch
**Symptoms**:
- App shows "Failed to launch SDK" toast
- No SDK UI appears
- Logcat: `ActivityNotFoundException` or `SecurityException`

**Causes**:
- ❌ Missing camera permission
- ❌ Invalid access token (expired or malformed)
- ❌ Incorrect workflow ID
- ❌ SDK not registered before `setContent()`

**Solutions**:
1. Request runtime camera permission before launching SDK:
   ```kotlin
   if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
       ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), 100)
   }
   ```
2. Verify access token is valid JWT (check expiry)
3. Ensure workflow ID matches HyperVerge dashboard
4. Move `registerHyperKycLauncher()` to `onCreate()` before `setContent()`

---

### Issue 3: Android App Can't Connect to Backend
**Symptoms**:
- Toast: "Error: Failed to connect to /"
- Logcat: `UnknownHostException` or `ConnectException`

**Causes**:
- ❌ Wrong backend URL in BuildConfig
- ❌ Emulator using `localhost` instead of `10.0.2.2`
- ❌ Physical device not on same WiFi as backend
- ❌ CORS not enabled on backend

**Solutions**:
1. **For Android Emulator**:
   ```kotlin
   buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")
   ```
2. **For Physical Device**:
   ```kotlin
   buildConfigField("String", "API_BASE_URL", "\"http://YOUR_LOCAL_IP:3000\"")
   // Find IP: On Mac/Linux: ifconfig | grep "inet "
   ```
3. **Enable CORS in Backend** (already done in `index.js` line 26-30)
4. **Use Ngrok for Testing**:
   ```bash
   ngrok http 3000
   # Use ngrok URL in Android app
   ```

---

### Issue 4: SDK Result Always Returns "error"
**Symptoms**:
- Every workflow ends with status: `error`
- Error code: `1001` or `1002`
- Error message: "Invalid configuration" or "Workflow not found"

**Causes**:
- ❌ Workflow ID mismatch
- ❌ Workflow not published in HyperVerge dashboard
- ❌ Transaction ID already used (not unique)
- ❌ Required workflow inputs missing

**Solutions**:
1. Double-check workflow ID spelling (case-sensitive)
2. Verify workflow is published and active in HyperVerge portal
3. Generate new transaction ID for each attempt
4. Check if workflow requires specific inputs:
   - Default workflow: May need `MANUALNAME` input
   - Custom workflows: Check documentation for required inputs
5. Use `setInputs()` to provide required values:
   ```kotlin
   config.setInputs(hashMapOf(
       "MANUALNAME" to "John Doe",
       "EMAIL" to "john@example.com"
   ))
   ```

---

### Issue 5: Gradle Build Fails - SSL Certificate Error
**Symptoms**:
- Build error: `Could not verify SSL certificate`
- Behind corporate proxy (Zscaler, Cisco AnyConnect, etc.)

**Solution**:
Create `disable-ssl.init.gradle.kts` (as documented in session):
```kotlin
// Only for development - DO NOT use in production
import javax.net.ssl.*
import java.security.cert.X509Certificate

println("⚠️  WARNING: Disabling SSL verification for Gradle dependencies")

buildscript {
    repositories.all {
        if (this is MavenArtifactRepository) {
            isAllowInsecureProtocol = true
        }
    }
}

// Trust all SSL certificates
val trustAllCerts = arrayOf<TrustManager>(object : X509TrustManager {
    override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {}
    override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {}
    override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
})

SSLContext.getInstance("TLS").apply {
    init(null, trustAllCerts, java.security.SecureRandom())
    HttpsURLConnection.setDefaultSSLSocketFactory(socketFactory)
}

HttpsURLConnection.setDefaultHostnameVerifier { _, _ -> true }
```

**Build with**:
```bash
./gradlew --init-script disable-ssl.init.gradle.kts assembleDebug
```

---

## 📊 Key Metrics to Monitor

### Backend Metrics
- **Endpoint Response Time**: < 5 seconds (token generation)
- **HyperVerge API Latency**: Typically 2-3 seconds
- **Success Rate**: > 95% for valid requests
- **Error Rate**: Track 4xx (client errors) vs 5xx (server errors)

### Android App Metrics
- **APK Size**: ~46 MB with HyperKYC SDK 2.0.0
- **SDK Launch Time**: < 2 seconds
- **Verification Completion Rate**: Track % of users who complete workflow
- **Crash Rate**: Monitor crashes during SDK initialization

### User Experience Metrics
- **Average Workflow Duration**: 2-5 minutes (document + face capture)
- **Auto-Approval Rate**: Depends on workflow configuration
- **User Drop-off Points**: Track where users exit (document capture, face capture, etc.)

---

## 📚 Additional Resources

### HyperVerge Documentation
- **SDK Documentation**: [https://docs.hyperverge.co](https://docs.hyperverge.co)
- **API Reference**: [https://apidocs.hyperverge.co](https://apidocs.hyperverge.co)
- **Workflow Configuration**: HyperVerge Dashboard → Workflows

### Code Repositories
- **Backend**: `backend/index.js`
- **Android App**: `rb_android_sdk_tester/`
- **Setup Guide**: `SETUP_GUIDE.md`

### Support Contacts
- **HyperVerge Support**: [support@hyperverge.co](mailto:support@hyperverge.co)
- **API Issues**: Raise ticket in HyperVerge portal
- **Integration Questions**: Check HyperVerge developer Slack/Discord

---

## 🎓 Integration Engineer Takeaways

### Security Best Practices
1. ✅ **Never expose AppId/AppKey in client apps**
2. ✅ **Use short-lived access tokens** (12-24 hours max)
3. ✅ **Validate all inputs** in backend before calling HyperVerge
4. ✅ **Use HTTPS** for all API calls (except local dev)
5. ✅ **Implement rate limiting** on token generation endpoint
6. ✅ **Log security events** (failed attempts, invalid credentials)

### Performance Optimization
1. ⚡ **Connection Pooling**: OkHttp automatically handles this
2. ⚡ **Token Caching**: Consider caching tokens for same transactionId (if retrying)
3. ⚡ **Timeout Configuration**: 30s for app, 10s for backend
4. ⚡ **SDK Size**: Exclude unused modules to reduce APK size

### Debugging Tips
1. 🔍 **Enable HTTP Logging**: `HttpLoggingInterceptor.Level.BODY` in debug builds
2. 🔍 **Check Logcat Tags**: `RbSdkTester`, `OkHttp`, `HyperVerge`
3. 🔍 **Backend Logs**: Console logs show full request/response flow
4. 🔍 **Transaction ID Tracking**: Use unique IDs to trace sessions end-to-end

### Testing Checklist
- [ ] Test with real documents (Aadhaar, PAN, License)
- [ ] Test face capture with different lighting conditions
- [ ] Test error scenarios (network offline, permission denied)
- [ ] Test on different Android versions (API 24-35)
- [ ] Test on low-end devices (< 2GB RAM)
- [ ] Test workflow inputs (default MANUALNAME, custom key-value)

---

## 🏁 Conclusion

This implementation demonstrates **production-ready HyperVerge SDK integration** with:
- ✅ Secure token generation via backend
- ✅ Support for both default and dynamic workflows
- ✅ Comprehensive error handling
- ✅ Clean architecture with separation of concerns
- ✅ Detailed logging for debugging

**Next Steps**:
1. Deploy backend to production (Vercel/AWS)
2. Configure IP whitelisting with HyperVerge
3. Test with real documents and users
4. Monitor success/failure rates
5. Optimize workflow based on user feedback

**Questions?** Refer to [HyperVerge Documentation](https://docs.hyperverge.co) or contact support.

---

**Document Version**: 1.0.0  
**Last Updated**: February 20, 2026  
**Author**: Rohan Baiju - Integration Engineer  
**Project Repository**: `android_sdk_integration_hv/`
