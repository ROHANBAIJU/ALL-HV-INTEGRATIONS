# RB Android SDK Tester

A comprehensive testing application for the HyperVerge KYC Android SDK with dual-mode operation (Default & Dynamic credentials).

## 📱 Features

- **🎛️ Dual Mode Operation**
  - **Default Mode**: Uses backend-stored credentials (simple testing)
  - **Dynamic Mode**: Accepts custom credentials (flexible testing)

- **🔐 Secure Architecture**
  - Credentials stored in backend environment variables
  - Access token-based SDK initialization
  - No hardcoded secrets in APK

- **📋 Complete Workflow Testing**
  - Transaction ID generation
  - HyperVerge SDK integration
  - Comprehensive result handling

- **🎨 Modern UI**
  - Material Design 3
  - Jetpack Compose
  - Dedicated result screens for each status

- **📊Result Screens**
  - ✅ Auto-Approved
  - ❌ Auto-Declined
  - 🔍 Needs Review
  - 🚫 User Cancelled
  - ⚠️ Error

## 🏗️ Architecture

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   Android App    │────────▶│  Node.js Backend │────────▶│  HyperVerge API  │
│                  │  HTTPS  │   (Vercel)       │  HTTPS  │                  │
│  - Mode Selection│         │  - Token Gen     │         │  - Auth          │
│  - Credentials   │         │  - Validation    │         │  - Workflows     │
│  - SDK Launch    │         └──────────────────┘         └──────────────────┘
└──────────────────┘
        │
        │ Launches SDK
        ↓
┌──────────────────┐
│  HyperVerge SDK  │
│  - Doc Capture   │
│  - Face Capture  │
│  - Verification  │
└──────────────────┘
```

## 📋 Prerequisites

- **Android Studio**: Arctic Fox or later
- **Minimum SDK**: 24 (Android 7.0)
- **Target SDK**: 35 (Android 15)
- **Kotlin**: 1.9.0+
- **Backend**: Node.js backend (see `/backend` folder)
- **HyperVerge Account**: Valid credentials from HyperVerge dashboard

## 🚀 Setup Instructions

### 1. Backend Setup (Required)

First, set up and deploy the backend server:

```bash
cd ../backend
npm install
cp .env.example .env
# Edit .env with your HyperVerge credentials
npm run dev
```

For production, deploy to Vercel:

```bash
vercel
```

See [backend/README.md](../backend/README.md) for detailed instructions.

### 2. Configure API Base URL

Edit `app/build.gradle.kts` and set your backend URL:

```kotlin
defaultConfig {
    // For local development with Android Emulator
    buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")
    
    // For physical device on same WiFi
    // buildConfigField("String", "API_BASE_URL", "\"http://192.168.1.x:3000\"")
    
    // For ngrok tunnel (wireless debugging)
    // buildConfigField("String", "API_BASE_URL", "\"https://your-ngrok-url.ngrok.io\"")
    
    // For production (Vercel)
    // buildConfigField("String", "API_BASE_URL", "\"https://your-app.vercel.app\"")
}
```

### 3. Build the App

```bash
./gradlew assembleDebug
```

### 4. Install on Device

**Via USB:**
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Via Wireless ADB:**
```bash
# Connect to device wirelessly
adb connect <device-ip>:5555

# Install
adb install app/build/outputs/apk/debug/app-debug.apk
```

## 📱 Usage

### Default Mode (Simple)

1. Select **"Default Mode"**
2. Click **"Generate Transaction ID"**
3. Click **"🚀 Initialize Workflow"**
4. Complete the verification in HyperVerge SDK
5. View results on dedicated result screen

### Dynamic Mode (Advanced)

1. Select **"Dynamic Mode"**
2. Enter your **App ID**
3. Enter your **App Key**
4. Enter your **Workflow ID**
5. Click **"Generate Transaction ID"**
6. Click **"🚀 Initialize Workflow"**
7. Complete the verification
8. View results

## 🛠️ Testing with ADB Wireless Debugging

### Enable Wireless Debugging on Android 11+

1. **On your phone:**
   - Go to **Settings → Developer Options**
   - Enable **Wireless debugging**
   - Note the IP address and port (e.g., `192.168.1.100:37777`)

2. **On your computer:**
   ```bash
   # Pair device (first time only)
   adb pair <ip>:<pair-port>
   # Enter pairing code from phone
   
   # Connect to device
   adb connect <ip>:<debug-port>
   
   # Verify connection
   adb devices
   ```

3. **Install and test:**
   ```bash
   ./gradlew installDebug
   adb logcat | grep "RbSdkTester"
   ```

### Using Ngrok for Local Backend Access

If testing with a physical device on different network:

```bash
# In backend folder
npm run dev

# In another terminal
ngrok http 3000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
# Update app/build.gradle.kts with the ngrok URL
# Rebuild the app
```

## 📝 Code Structure

```
app/src/main/java/com/rb/sdktester/
├──MainActivity.kt              # Main activity with SDK integration
├── models/
│   ├── AppMode.kt              # Mode enum (Default/Dynamic)
│   └── SdkResultStatus.kt      # Result status enum
├── network/
│   ├── ApiClient.kt            # Retrofit client
│   ├── ApiService.kt           # API interface
│   └── ApiModels.kt            # Request/response models
└── ui/
    ├── theme/
    │   ├── Color.kt            # Color definitions
    │   ├── Theme.kt            # Material theme
    │   └── Type.kt             # Typography
    └── screens/
        ├── InputScreen.kt      # Main input screen
        ├── AutoApprovedScreen.kt
        ├── AutoDeclinedScreen.kt
        ├── NeedsReviewScreen.kt
        ├── UserCancelledScreen.kt
        └── ErrorScreen.kt
```

## 🔧 Configuration

### API Base URL

Located in `app/build.gradle.kts`:

- **Emulator**: `http://10.0.2.2:3000`
- **Physical Device (same WiFi)**: `http://192.168.1.x:3000`
- **Ngrok**: `https://your-ngrok-url.ngrok.io`
- **Production**: `https://your-app.vercel.app`

### HyperVerge SDK Version

Located in `gradle/libs.versions.toml`:

```toml
[versions]
hyperkyc = "2.4.1"
```

## 📊 Logging

The app logs detailed information for debugging:

```bash
# View all app logs
adb logcat | grep "RbSdkTester"

# View HyperVerge SDK logs
adb logcat | grep "HyperKYC"
```

## ⚠️ Troubleshooting

### Backend Connection Issues

1. **Check backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **For emulator**, use `10.0.2.2` instead of `localhost`

3. **For physical device**, ensure same WiFi network

4. **Check firewall** settings on backend machine

### SDK Launch Issues

1. **Check permissions** in AndroidManifest.xml
2. **Verify transaction ID** is generated
3. **Check backend logs** for token generation
4. **Review LogCat** for detailed errors

### Build Issues

1. **Clean and rebuild:**
   ```bash
   ./gradlew clean
   ./gradlew assembleDebug
   ```

2. **Invalidate caches** in Android Studio

3. **Check internet connection** for dependencies

## 📄 License

MIT License - Free to use and modify

## 🤝 Support

- **HyperVerge Docs**: https://docs.hyperverge.co
- **Backend README**: [../backend/README.md](../backend/README.md)

## 👨‍💻 Author

Rohan Baiju

---

**Note**: This is a testing application. For production use, implement proper error handling, security measures, and user authentication.
