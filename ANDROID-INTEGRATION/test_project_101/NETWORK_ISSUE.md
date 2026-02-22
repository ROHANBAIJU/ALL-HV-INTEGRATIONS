# ⚠️ IMPORTANT: Network/SSL Issue Resolution

## The Problem
Your corporate network uses **Zscaler** which intercepts HTTPS traffic. Java/Gradle doesn't trust Zscaler's SSL certificates, so it **cannot download Android build dependencies**.

## This Affects:
- ❌ Building ANY Android project (including this test project)
- ❌ Gradle dependency resolution
- ❌ Android Gradle Plugin download
- ❌ Kotlin plugin download

## This Does NOT Affect:
- ✅ Running pre-built APKs on emulator or device
- ✅ ADB commands
- ✅ Emulator itself
- ✅ Your code (once built)

---

## Solutions (Choose ONE)

### Solution 1: Use Different Network (RECOMMENDED) ⭐
**Switch to a network WITHOUT Zscaler/corporate proxy:**
1. Disconnect from work VPN
2. Connect to: Personal WiFi / Mobile Hotspot / Home Network
3. Run build:
```bash
cd /Users/rohanbaiju/Desktop/android_sdk_integration_hv/test_project_101
./build-and-run.sh
```

### Solution 2: Import Zscaler Certificate (Requires Admin Rights)
```bash
# Find Zscaler certificate
security find-certificate -c "Zscaler" -p /Library/Keychains/System.keychain > /tmp/zscaler.pem

# Import to Android Studio JDK (enter password when prompted)
sudo keytool -importcert -alias zscaler \
  -cacerts \
  -storepass changeit \
  -file /tmp/zscaler.pem \
  -noprompt \
  -J-Djava.home="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

# Restart all Gradle daemons
./gradlew --stop

# Try building
./build-and-run.sh
```

### Solution 3: Build on Different Machine
- Build APK on machine with normal internet access
- Copy APK to this machine
- Run on emulator: `adb install app-debug.apk`

---

## Quick Test (Check if network blocks Gradle)
```bash
curl -I https://plugins.gradle.org/m2/
```

✅ **Working**: You'll see `HTTP/2 200`  
❌ **Blocked**: SSL errors or connection failures

---

## Emulator Info
- **Available Emulator**: `Medium_Phone_API_36.1`
- **Start Emulator**: `./start-emulator.sh`
- **Check Status**: `adb devices`

---

## Summary
**The test project is fully set up** ✅  
**BUT** you need to resolve the network/SSL issue **before building** ⚠️

Choose Solution 1 (switch networks) for fastest results.
