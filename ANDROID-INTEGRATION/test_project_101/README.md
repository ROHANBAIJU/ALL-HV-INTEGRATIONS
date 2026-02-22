# Test Project 101 🎉

A minimal Android app to test the development environment.

## Features
- Single screen with Jetpack Compose
- Click counter functionality
- Material Design 3

## Build Instructions

### Prerequisites
- JDK 17 or higher
- Android SDK
- Network access to download dependencies (Zscaler/corporate proxy may block)

### Build APK
```bash
cd test_project_101
./gradlew assembleDebug
```

### Run on Emulator
```bash
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd <avd_name> &

# Install APK
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Network Issues (Zscaler/Corporate Proxy)

If build fails with SSL certificate errors:
1. Disconnect from corporate VPN/network
2. Connect to personal WiFi or mobile hotspot
3. Run build again

## App Structure
```
app/
├── src/main/
│   ├── AndroidManifest.xml
│   ├── java/com/test/project101/
│   │   └── MainActivity.kt          # Main activity with UI
│   └── res/
│       ├── values/
│       │   ├── themes.xml
│       │   └── colors.xml
│       └── mipmap-*/                # App icons
├── build.gradle.kts                 # App-level build config
└── proguard-rules.pro
```
