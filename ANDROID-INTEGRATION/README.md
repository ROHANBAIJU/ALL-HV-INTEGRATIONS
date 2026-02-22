# HyperVerge Android SDK Integration Project

Complete implementation of HyperVerge KYC Android SDK with secure backend token generation and dual-mode operation.

## 📁 Project Structure

```
HV-ANDROID-SDK-INTEGRATION/
├── backend/                          # Node.js Backend (Vercel)
│   ├── index.js                      # Express server with token generation
│   ├── package.json                  # Dependencies
│   ├── vercel.json                   # Vercel deployment config
│   ├── .env.example                  # Environment variables template
│   └── README.md                     # Backend setup instructions
│
├── rb_android_sdk_tester/            # Android App
│   ├── app/
│   │   ├── build.gradle.kts          # App-level Gradle config
│   │   └── src/main/
│   │       ├── AndroidManifest.xml   # App manifest with permissions
│   │       ├── java/com/rb/sdktester/
│   │       │   ├── MainActivity.kt   # Main activity with SDK integration
│   │       │   ├── models/           # Data models (AppMode, SdkResultStatus)
│   │       │   ├── network/          # API client and models
│   │       │   └── ui/               # UI screens and theme
│   │       └── res/                  # Android resources
│   ├── build.gradle.kts              # Project-level Gradle config
│   ├── settings.gradle.kts           # Gradle settings with SDK repository
│   └── README.md                     # Android app documentation
│
├── SAMPLEPROJECT/                    # Original HyperVerge sample project
│   └── hyperkyc-android/
│
└── DOCUMENTATION/                    # HyperVerge SDK documentation
    ├── documnetation1.txt            # SDK introduction
    ├── documentation2.txt            # Quick start guide
    ├── documenatation3.txt           # Integration guide
    ├── documentation4.txt           # FAQs
    ├── documentation5.txt            # Changelog
    ├── documentation6.txt            # Dependencies
    └── important credentials.txt     # Default credentials
```

## 🎯 Project Overview

This project implements a complete HyperVerge KYC Android SDK integration with:

### 🔧 Backend (Node.js + Express)
- **Token Generation API**: Securely generates HyperVerge access tokens
- **Dual Mode Support**: Handles both default and dynamic credentials
- **Vercel Deployment**: Ready for serverless deployment
- **Environment-based Config**: Secure credential storage

### 📱 Android App (Kotlin + Jetpack Compose)
- **Two Operating Modes**:
  - **Default Mode**: Uses backend environment credentials
  - **Dynamic Mode**: Accepts custom credentials from user
- **Complete Integration**: Full HyperVerge SDK workflow
- **Result Handling**: Dedicated screens for all 5 result statuses
- **Modern UI**: Material Design 3 with Jetpack Compose
- **Comprehensive Logging**: Detailed logs for debugging

## 🚀 Quick Start

### 1. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your HyperVerge credentials:
# DEFAULT_APP_ID=c52h5j
# DEFAULT_APP_KEY=HV:q7aqkdhe5b39vfmeg
# DEFAULT_WORKFLOW_ID=rb_sureguard_insurance

# Start development server
npm run dev

# Server will run on http://localhost:3000
```

### 2. Deploy Backend to Vercel (Optional)

```bash
npm install -g vercel
vercel login
vercel

# Add environment variables in Vercel Dashboard:
# - DEFAULT_APP_ID
# - DEFAULT_APP_KEY
# - DEFAULT_WORKFLOW_ID
```

### 3. Setup Android App

```bash
cd rb_android_sdk_tester

# Configure backend URL in app/build.gradle.kts
# For emulator: http://10.0.2.2:3000
# For physical device: http://YOUR_IP:3000 or ngrok URL
# For production: https://your-app.vercel.app

# Build the app
./gradlew assembleDebug
```

### 4. Install on Device

**USB Connection:**
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Wireless ADB (Android 11+):**
```bash
# Enable wireless debugging on phone (Settings → Developer Options)
adb connect <device-ip>:5555
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 5. Test the App

1. Open the app
2. Select mode (Default or Dynamic)
3. Generate Transaction ID
4. Initialize Workflow
5. Complete verification
6. View results

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────▼────────────┐
                │   Select Mode           │
                │   ┌──────┬──────┐      │
                │   │ Default│ Dynamic│   │
                │   └──────┴──────┘      │
                └────────────┬────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │ Dynamic Mode                            │ Default Mode
        │ Enter:                                  │ (No input needed)
        │ - App ID                                │
        │ - App Key                               │
        │ - Workflow ID                           │
        └────────────────────┬────────────────────┘
                             │
                ┌────────────▼────────────┐
                │  Generate Transaction ID│
                │  txn_<timestamp>_<uuid> │
                └────────────┬────────────┘
                             │
                ┌────────────▼────────────┐
                │  Initialize Workflow    │
                └────────────┬────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│               BACKEND API CALL                           │
│  POST /api/generate-access-token                         │
│  {                                                        │
│    mode: "default" | "dynamic",                          │
│    transactionId: "txn_...",                             │
│    appId: "..." (dynamic only),                          │
│    appKey: "..." (dynamic only),                         │
│    workflowId: "..." (dynamic only)                      │
│  }                                                        │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│          BACKEND PROCESSING                              │
│  1. Validate request                                     │
│  2. Get credentials (env or request)                     │
│  3. Call HyperVerge Auth API                             │
│  4. Return access token                                  │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│         HYPERVERGE AUTH API                              │
│  POST https://ind.docs.hyperverge.co/v2.0/getAccessToken│
│  { appId, appKey, transactionId }                        │
│  → Returns short-lived access token                      │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│         APP RECEIVES TOKEN                               │
│  { accessToken, workflowId, transactionId }             │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│         CREATE HYPERKYC CONFIG                           │
│  HyperKycConfig(                                         │
│    accessToken = token,                                  │
│    workflowId = workflow,                                │
│    transactionId = txnId                                 │
│  )                                                        │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│         LAUNCH HYPERVERGE SDK                            │
│  hyperKycLauncher.launch(config)                         │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│         SDK WORKFLOW EXECUTION                           │
│  - Document capture                                      │
│  - Face capture  │
│  - Liveness detection                                    │
│  - Verification processing                               │
└────────────────────────────┬─────────────────────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
┌───────────────────┐                   ┌───────────────────┐
│  auto_approved    │                   │  auto_declined    │
│  ✅ Success       │                   │  ❌ Failed        │
└─────────┬─────────┘                   └─────────┬─────────┘
          │                                       │
          │         ┌────────────────┐            │
          └────────▶│  needs_review  │◀───────────┘
                    │  🔍 Review     │
                    └────────┬───────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
┌───────────────────┐                   ┌───────────────────┐
│  user_cancelled   │                   │  error            │
│  🚫 Cancelled     │                   │  ⚠️ Error        │
└─────────┬─────────┘                   └─────────┬─────────┘
          │                                       │
          └────────────────┬──────────────────────┘
                           │
               ┌───────────▼──────────┐
               │  Display Result      │
               │  Screen              │
               └──────────────────────┘
```

## 🔐 Security Features

- **No Hardcoded Credentials**: All sensitive data in backend env variables
- **Access Token Auth**: Short-lived tokens instead of static credentials
- **Backend Validation**: Request validation before token generation
- **Secure Communication**: HTTPS for all API calls
- **ProGuard Ready**: Code obfuscation rules included

## 📝 Key Features

### Backend
- ✅ Health check endpoint
- ✅ Token generation with mode support
- ✅ Comprehensive error handling
- ✅ Request validation
- ✅ Detailed logging
- ✅ CORS enabled
- ✅ Vercel deployment ready

### Android App
- ✅ Mode selection (Default/Dynamic)
- ✅ Transaction ID generation (UUID + timestamp)
- ✅ Input validation
- ✅ Backend API integration (Retrofit)
- ✅ HyperVerge SDK integration
- ✅ 5 dedicated result screens
- ✅ Material Design 3
- ✅ Jetpack Compose UI
- ✅ Comprehensive logging
- ✅ Error handling
- ✅ Loading states

## 🛠️ Technologies Used

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **HTTP Client**: Axios
- **Deployment**: Vercel Serverless Functions

### Android App
- **Language**: Kotlin 1.9.0
- **UI**: Jetpack Compose
- **Architecture**: MVVM-like state management
- **Networking**: Retrofit + OkHttp
- **JSON**: Gson
- **SDK**: HyperVerge KYC 2.4.1
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 35 (Android 15)

## 📱 Testing with ADB Wireless

Perfect for testing on physical devices:

1. **Enable Wireless Debugging** on your Android device
2. **Connect via ADB**:
   ```bash
   adb connect <device-ip>:5555
   ```
3. **Install the app**:
   ```bash
   ./gradlew installDebug
   ```
4. **View logs**:
   ```bash
   adb logcat | grep "RbSdkTester"
   ```

For local backend access from physical device, use **ngrok**:
```bash
# In backend folder
npm run dev

# In another terminal
ngrok http 3000

# Use the ngrok URL in app's build.gradle.kts
```

## 📚 Documentation

- **Backend**: [backend/README.md](backend/README.md)
- **Android App**: [rb_android_sdk_tester/README.md](rb_android_sdk_tester/README.md)
- **HyperVerge Docs**: [DOCUMENTATION/](DOCUMENTATION/)
- **Sample Project**: [SAMPLEPROJECT/hyperkyc-android/](SAMPLEPROJECT/hyperkyc-android/)

## ⚙️ Configuration

### Backend Environment Variables
```env
DEFAULT_APP_ID=c52h5j
DEFAULT_APP_KEY=HV:q7aqkdhe5b39vfmeg
DEFAULT_WORKFLOW_ID=rb_sureguard_insurance
PORT=3000
HYPERVERGE_AUTH_URL=https://ind.docs.hyperverge.co/v2.0/getAccessToken
```

### Android Build Configuration
Located in `rb_android_sdk_tester/app/build.gradle.kts`:
```kotlin
buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")
```

## 🐛 Troubleshooting

### Backend Not Reachable
- Check backend is running: `curl http://localhost:3000/health`
- For emulator, use `10.0.2.2` instead of `localhost`
- For physical device, use computer's IP address
- Check firewall settings

### SDK Launch Fails
- Verify transaction ID is generated
- Check backend logs for token generation
- Review LogCat for detailed errors
- Ensure permissions are granted

### Build Errors
- Clean project: `./gradlew clean`
- Invalidate caches in Android Studio
- Check internet connection for dependencies
- Sync Gradle files

## 📄 License

MIT License - Free to use and modify

## 👨‍💻 Author

Rohan Baiju

---

## 🎯 Next Steps

1. ✅ **Backend deployed** to Vercel
2. ✅ **App tested** with both modes
3. 🔄 **Optional**: Add webhook handling for async results
4. 🔄 **Optional**: Implement user authentication
5. 🔄 **Optional**: Add analytics tracking
6. 🔄 **Optional**: Add unit tests

**Happy Testing! 🚀**
