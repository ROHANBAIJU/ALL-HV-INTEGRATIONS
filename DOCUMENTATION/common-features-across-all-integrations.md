# Common Features Across All HyperVerge SDK Integrations

> This document describes the shared architecture, API contracts, UI patterns, and behavioral specifications that are **consistent across all three native SDK integrations** — Android (Kotlin), Flutter (Dart), and React Native (TypeScript). It serves as the single source of truth for how the integrations work together.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Shared Backend (Unified API)](#2-shared-backend-unified-api)
3. [Environment Configuration](#3-environment-configuration)
4. [Mode System (Default vs Dynamic)](#4-mode-system-default-vs-dynamic)
5. [Transaction ID Generation](#5-transaction-id-generation)
6. [Token Generation Flow](#6-token-generation-flow)
7. [SDK Launch & Configuration](#7-sdk-launch--configuration)
8. [Workflow Inputs](#8-workflow-inputs)
9. [SDK Result Handling](#9-sdk-result-handling)
10. [Results Dashboard](#10-results-dashboard)
11. [Webhook System](#11-webhook-system)
12. [Status Codes & Display Logic](#12-status-codes--display-logic)
13. [Tech Stack Per Platform](#13-tech-stack-per-platform)
14. [File Structure Overview](#14-file-structure-overview)
15. [Credentials & Constants](#15-credentials--constants)

---

## 1. Project Overview

All three integrations are **SDK tester apps** that let a developer test the HyperVerge KYC SDK with two modes:

| Feature                    | Android           | Flutter            | React Native       |
|----------------------------|-------------------|--------------------|--------------------|
| Language                   | Kotlin            | Dart               | TypeScript         |
| SDK Library                | `co.hyperverge.hyperkyc` | `hyperkyc_flutter` | `react-native-hyperkyc-sdk` |
| SDK Version tested         | Latest            | Latest             | 2.0.0              |
| Backend (shared)           | ✅ Unified        | ✅ Unified         | ✅ Unified         |
| Default Mode               | ✅                | ✅                 | ✅                 |
| Dynamic Mode               | ✅                | ✅                 | ✅                 |
| Results Dashboard          | ✅                | ✅                 | ✅                 |
| Webhook Polling            | ✅                | ✅                 | ✅                 |
| Environment Toggle (Dev/Prod) | ✅             | ✅                 | ✅                 |

---

## 2. Shared Backend (Unified API)

All three native apps talk to the **same** backend server.

### Base URLs

| Environment | URL |
|-------------|-----|
| **Production** | `https://unified-backend-for-all-sdks-d76nz9uok.vercel.app` |
| **Development** | `http://192.168.0.105:3000` *(local WiFi, physical device must be on same network)* |

### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/token/generate` | Generate HyperVerge access token |
| `GET` | `/api/webhook/results/:transactionId` | Fetch stored webhook result by transaction ID |
| `POST` | `/api/webhook/results` | Receive webhook callback from HyperVerge servers |
| `GET` | `/api/webhook/results` | Get all stored results (debug use) |
| `GET` | `/health` | Server health check — returns 200 if alive |
| `POST` | `/api/files/upload` | File upload endpoint |

### Request Headers (all API calls)

```
Content-Type: application/json
x-platform: android | flutter | react-native   ← used for server analytics/logging
```

---

## 3. Environment Configuration

All three apps implement an identical **environment toggle** — a single boolean flag that switches between DEV and PROD base URLs. The pattern is a singleton that rebuilds the HTTP client when toggled.

### Android — `EnvironmentConfig.kt`

```kotlin
object EnvironmentConfig {
    private val devBaseUrl = BuildConfig.DEV_BASE_URL        // from build.gradle
    private val prodBaseUrl = BuildConfig.PROD_BASE_URL       // from build.gradle
    var isProduction: Boolean = false                         // default = DEV
    val baseUrl: String get() = if (isProduction) prodBaseUrl else devBaseUrl

    fun switchToDevelopment() { isProduction = false; ApiClient.rebuild() }
    fun switchToProduction() { isProduction = true; ApiClient.rebuild() }
}
```

### Flutter — `lib/config/api_config.dart`

```dart
class ApiConfig {
  static const String localBaseUrl = 'http://192.168.0.105:3000';
  static const String productionBaseUrl = 'https://unified-backend-for-all-sdks-d76nz9uok.vercel.app';

  static String get baseUrl => _useProduction ? productionBaseUrl : localBaseUrl;
  static bool _useProduction = false;

  static void switchToProduction() => _useProduction = true;
  static void switchToDevelopment() => _useProduction = false;

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);
}
```

### React Native — `src/config/ApiConfig.ts`

```typescript
const DEV_BASE_URL = 'http://192.168.0.105:3000';
const PROD_BASE_URL = 'https://unified-backend-for-all-sdks-d76nz9uok.vercel.app';

class ApiConfig {
  private static isProduction = false;
  static get baseUrl() { return this.isProduction ? PROD_BASE_URL : DEV_BASE_URL; }

  static switchToProduction() { this.isProduction = true; }
  static switchToDevelopment() { this.isProduction = false; }
  static toggleEnvironment() { this.isProduction = !this.isProduction; }
}
```

### UI Indicator

All three apps display a **colored status dot** next to the environment label:
- 🟢 Green dot = Production (live)
- 🟡 Yellow/Orange dot = Development (local)

The dot turns red if the health check fails.

---

## 4. Mode System (Default vs Dynamic)

Both modes generate a real HyperVerge access token via the backend. The difference is **whose credentials** are used.

### Default Mode

- User only enters their **name** (displayed in SDK as pre-filled).
- Backend uses its own server-side credentials (`process.env.DEFAULT_APP_ID`, `process.env.DEFAULT_APP_KEY`, `process.env.DEFAULT_WORKFLOW_ID`).
- Client sends only `{ mode, transactionId }` — no credentials in the request body.
- Backend hardcoded defaults (also mirrored in Flutter `ApiConfig`):
  - `appId = c52h5j`
  - `appKey = HV:q7aqkdhe5b39vfmeg`
  - `workflowId = rb_sureguard_insurance`

### Dynamic Mode

- User manually enters `App ID`, `App Key`, `Workflow ID`.
- Optionally adds **custom key-value workflow input rows**.
- Client sends `{ mode, transactionId, appId, appKey, workflowId }`.
- Backend validates and uses the provided credentials.

### Mode Enum (identical across platforms)

| Platform | Enum values |
|----------|-------------|
| Android  | `AppMode.DEFAULT`, `AppMode.DYNAMIC` |
| Flutter  | `AppMode.defaultMode`, `AppMode.dynamicMode` |
| React Native | `'default'`, `'dynamic'` (string literals) |

### API mode string mapping

All apps convert their internal enum to the backend API string:
- Default mode → `"default"`
- Dynamic mode → `"dynamic"`

---

## 5. Transaction ID Generation

A unique transaction ID is generated **on the client** before calling the backend. It is passed to both the token API and the SDK config.

| Platform    | Format                           | Example                                    |
|-------------|----------------------------------|--------------------------------------------|
| Android     | `txn_<epoch_ms>_<random8>` | `txn_1718291234567_a3f9b21c`              |
| React Native| `txn_<epoch_ms>_<random8>` | `txn_1718291234567_d4e8a1b7`              |
| Flutter     | `flutter_<uuid_v4>`       | `flutter_a1b2c3d4-e5f6-...`               |

The format difference is cosmetic — HyperVerge only requires uniqueness.

---

## 6. Token Generation Flow

The entire flow is identical across all three apps:

```
Client App
   │
   ├─ 1. User fills input (name for Default / credentials for Dynamic)
   ├─ 2. Generate transactionId (client-side, unique per session)
   │
   └─ 3. POST /api/token/generate
         Body: {
           mode: "default" | "dynamic",
           transactionId: "txn_...",
           // Dynamic only:
           appId?: "...",
           appKey?: "...",
           workflowId?: "..."
         }
         Headers: {
           Content-Type: "application/json",
           x-platform: "android" | "flutter" | "react-native"
         }

Backend
   ├─ 4. Validate request (mode required, transactionId required)
   ├─ 5. Select credentials (env vars for default, client values for dynamic)
   └─ 6. POST https://auth.hyperverge.co/login
         Body: {
           appId, appKey, transactionId, workflowId,
           expiry: 43200  // 12 hours
         }

   Returns to client:
   {
     success: true,
     accessToken: "...",
     workflowId: "rb_sureguard_insurance",
     transactionId: "txn_...",
     mode: "default",
     expiresIn: 43200,
     timestamp: "2024-...",
     platform: "android",
     inputs?: { ... }    // only if inputs were provided in request
   }
```

### Error Response Shape

```json
{
  "success": false,
  "error": "HyperVerge API error | Network error | Internal server error",
  "message": "Human readable description",
  "code": "HYPERVERGE_API_ERROR | NETWORK_ERROR | INTERNAL_ERROR | MISSING_TRANSACTION_ID | MISSING_MODE | MISSING_REQUIRED_FIELDS | ...",
  "details": { ... }
}
```

---

## 7. SDK Launch & Configuration

After receiving the access token from the backend, all apps build a `HyperKycConfig` object and launch the SDK.

### Android

```kotlin
val config = HyperKycConfig(
    accessToken = tokenData.accessToken,
    workflowId = tokenData.workflowId,
    transactionId = currentTransactionId
).apply {
    setInputs(inputsMap)          // key-value map of workflow inputs
    setUseLocation(false)
    setDefaultLangCode("en")
}
HyperKyc.launch(activity, config, KYC_REQUEST_CODE)
```

### Flutter

```dart
final config = HyperKycConfig.fromAppIdAppKey(
  appId,
  appKey,
  workflowId,
  transactionId,
);
config.setInputs(storedInputs);   // from backend token response `.inputs`
final result = await HyperKyc.launch(context, config);
```

### React Native

```typescript
const config = new HyperKycConfig(accessToken, workflowId, transactionId);
config.setInputs(inputsObj);      // { MANUALNAME: name, ...customPairs }
const result = await HyperKyc.start(config);
```

---

## 8. Workflow Inputs

**Workflow inputs** are key-value pairs passed to the SDK. They pre-fill or control behavior inside the HyperVerge KYC workflow.

### MANUALNAME (Default Mode)

The one required input for Default mode across all platforms:

| Key | Platform sends | Source |
|-----|---------------|--------|
| `MANUALNAME` | Android ✅ | User text field |
| `MANUALNAME` | Flutter ✅ | User text field |
| `MANUALNAME` | React Native ✅ | User text field |

> **Critical**: Key must be `MANUALNAME` — exact casing, all uppercase. Any other casing will fail.

### Dynamic Mode — Custom Inputs

All three apps support adding **arbitrary key-value rows** (e.g. `PAN_NUMBER`, `DOB`, etc.) that map 1:1 to the workflow's input schema. The user adds rows in the UI and they are merged into `setInputs()` on the SDK config.

### Inputs Flow

```
Client → Backend: inputs NOT sent during token generation
                  (HyperVerge token API ignores inputs)

Backend → Client: inputs echoed back in token response `.inputs` field
                  if the client included them

Client → SDK:     inputs passed via config.setInputs()
```

---

## 9. SDK Result Handling

All three apps handle the same three outcome categories after the SDK closes:

| Category | Condition | Navigation |
|----------|-----------|------------|
| **Success** | SDK returned a result with status | → ResultsDashboard |
| **User Cancelled** | User tapped Back / dismissed SDK | → ResultsDashboard (with `user_cancelled` status) |
| **Error** | Exception thrown, token expired, network issue | → ResultsDashboard (with `error` status) |

### Result Object (cross-platform)

The SDK returns an object with these key fields (field names vary slightly by SDK but semantically identical):

```
{
  transactionId: string,
  status: "auto_approved" | "auto_declined" | "needs_review" | "user_cancelled" | "error",
  details: { ... },   // raw SDK result payload
  workflowId: string
}
```

---

## 10. Results Dashboard

All three apps implement a **three-tab results dashboard** shown after the SDK completes.

### Tabs

| Tab | Content |
|-----|---------|
| **SDK Response** | Raw SDK result object (JSON formatted) |
| **Outputs API** | SDK outputs/details from the workflow (parsed) |
| **Webhooks** | Webhook data fetched from backend via `GET /api/webhook/results/:transactionId` |

### Webhook Auto-Poll

- All apps automatically fetch webhook results **~800ms after the dashboard opens**.
- This gives HyperVerge's servers time to call back our backend webhook endpoint before the UI queries.
- If no result yet: shows a "Pending" state with a manual refresh button.
- The user can also manually tap refresh to re-query.

### Status Badges

The dashboard displays a colored status badge based on the verification result:

| Status | Color | Label |
|--------|-------|-------|
| `auto_approved` | 🟢 Green | Auto Approved |
| `auto_declined` | 🔴 Red | Auto Declined |
| `needs_review` | 🟡 Yellow | Needs Review |
| `user_cancelled` | 🔵 Blue/Grey | User Cancelled |
| `error` | 🟠 Orange/Red | Error |

---

## 11. Webhook System

HyperVerge calls the backend webhook endpoint after a KYC session completes.

### Webhook Receive Flow

```
HyperVerge servers
   └─ POST /api/webhook/results
      Body: {
        transactionId: "txn_...",
        workflowId: "rb_sureguard_insurance",
        status: "auto_approved" | ...,
        result: { ... },
        timestamp: "ISO8601"
      }

Backend
   ├─ Validate: transactionId must be present
   ├─ Store in memory: verificationResults Map<transactionId, result>
   └─ Respond 200: { success: true, transactionId }
```

### Webhook Query (Client → Backend)

```
GET /api/webhook/results/:transactionId

Response (found):
{
  "success": true,
  "data": {
    "transactionId": "txn_...",
    "workflowId": "...",
    "status": "auto_approved",
    "result": { ... },
    "timestamp": "...",
    "receivedAt": "...",
    "rawData": { ... }
  }
}

Response (not found):
{
  "success": false,
  "error": "Results not found",
  "message": "No verification results found for transaction: txn_..."
}
```

> **Note**: The backend uses in-memory storage (`Map`). Results are lost on server restart. For production, replace with a database.

---

## 12. Status Codes & Display Logic

```
auto_approved   → ✅ Green  → "Verification Successful"
auto_declined   → ❌ Red    → "Verification Declined"
needs_review    → 🔍 Yellow → "Under Review"
user_cancelled  → ↩ Grey   → "Session Cancelled"
error           → ⚠ Orange → "An error occurred"
```

These string keys come directly from the HyperVerge SDK result and webhook response. All three apps parse and display them identically.

---

## 13. Tech Stack Per Platform

### Android

| Component | Technology |
|-----------|------------|
| Language | Kotlin |
| Min SDK | 21 |
| Build Tool | Gradle 8.6 + AGP 8.3.2 |
| HTTP Client | Retrofit 2 + OkHttp |
| JSON | Gson |
| Architecture | ViewModel + LiveData (MVVM-lite) |
| Concurrency | Kotlin Coroutines |
| SDK | `co.hyperverge.hyperkyc` |

### Flutter

| Component | Technology |
|-----------|------------|
| Language | Dart |
| Framework | Flutter |
| HTTP Client | Dio (with interceptors) |
| State Management | Provider (`ChangeNotifier`) |
| SDK | `hyperkyc_flutter` |
| UUID | `uuid` package |

### React Native

| Component | Technology |
|-----------|------------|
| Language | TypeScript |
| Framework | React Native 0.73.6 |
| HTTP Client | `fetch` (native) with `AbortController` |
| Navigation | React Navigation 6 |
| SDK | `react-native-hyperkyc-sdk@2.0.0` |
| Build | AGP 8.3.2, Gradle 8.6, JDK 21 |

### Unified Backend

| Component | Technology |
|-----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| HTTP Client | Axios |
| Hosting | Vercel (serverless) |
| Storage | In-memory `Map` (webhook results) |

---

## 14. File Structure Overview

```
ALL-HV-INTEGRATIONS/
├── UNIFIED-BACKEND/
│   ├── server.js                      ← Express app entry point
│   ├── controllers/
│   │   ├── tokenController.js         ← POST /api/token/generate
│   │   └── webhookController.js       ← GET/POST /api/webhook/results
│   ├── routes/
│   │   ├── tokenRoutes.js
│   │   └── webhookRoutes.js
│   └── vercel.json                    ← Vercel serverless config
│
├── ANDROID-INTEGRATION/
│   └── rb_android_sdk_tester/
│       └── app/src/main/java/com/rb/sdktester/
│           ├── config/EnvironmentConfig.kt    ← Dev/Prod URL switcher
│           ├── models/AppMode.kt              ← Mode enum
│           ├── network/
│           │   ├── ApiClient.kt               ← Retrofit singleton
│           │   ├── ApiModels.kt               ← Request/Response data classes
│           │   └── ApiService.kt              ← Retrofit interface
│           └── ui/screens/
│               ├── MainActivity.kt            ← Input screen + SDK launch
│               └── ResultsDashboardScreen.kt  ← 3-tab results view
│
├── FLUTTER-REDESIGNED/
│   └── lib/
│       ├── config/api_config.dart             ← URLs, timeouts, credentials
│       ├── models/
│       │   ├── app_models.dart                ← AppMode enum, WorkflowInput
│       │   └── token_models.dart              ← TokenRequest/TokenResponse
│       ├── providers/kyc_provider.dart        ← State management (ChangeNotifier)
│       ├── services/api_service.dart          ← HTTP layer (Dio)
│       └── screens/
│           ├── home_screen.dart               ← Input screen + SDK launch
│           └── results_dashboard_screen.dart  ← 3-tab results view
│
└── REACT-NATIVE-INTEGRATION/
    └── rb-hyperverge-reactnative-sdk-tester/
        └── src/
            ├── config/ApiConfig.ts            ← Dev/Prod URL switcher (singleton)
            ├── api/ApiService.ts              ← fetch wrapper, token + webhook calls
            └── screens/
                ├── InputScreen.tsx            ← Mode selection + credential input
                └── ResultsDashboardScreen.tsx ← 3-tab results view
```

---

## 15. Credentials & Constants

These values are **hardcoded in Flutter's `ApiConfig`** and used as server env var defaults in the backend.

| Constant | Value | Used for |
|----------|-------|---------|
| `appId` | `c52h5j` | HyperVerge app identifier |
| `appKey` | `HV:q7aqkdhe5b39vfmeg` | HyperVerge app secret |
| `workflowId` | `rb_sureguard_insurance` | Default KYC workflow |
| `MANUALNAME` input key | `MANUALNAME` | Pre-fill name in SDK workflow |
| Token expiry | `43200` seconds | 12 hours (HyperVerge max: 86400) |

> These are **test/development** credentials. For production deployments, rotate and store these securely in environment variables only — never commit real production keys to source control.

---

*Document generated from reading all three native SDK integrations and the unified backend. Last updated: 2025.*
