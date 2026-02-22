#!/bin/bash
# Script to build and run Test Project 101 on Android emulator

set -e

echo "🚀 Building Test Project 101..."
cd "$(dirname "$0")"

export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME=~/Library/Android/sdk

# Build APK
echo "📦 Running Gradle build..."
./gradlew assembleDebug

# Check if build succeeded
if [ ! -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "❌ Build failed! APK not found."
    exit 1
fi

echo "✅ Build successful!"
echo "📱 APK location: app/build/outputs/apk/debug/app-debug.apk"

# Start emulator if not running
echo "🔍 Checking emulator status..."
ADB_DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)

if [ "$ADB_DEVICES" -eq 0 ]; then
    echo "🚀 Starting Android emulator..."
    $ANDROID_HOME/emulator/emulator -avd Medium_Phone_API_36.1 -no-snapshot-load &
    echo "⏳ Waiting for emulator to boot (30 seconds)..."
    sleep 30
    adb wait-for-device
    echo "✅ Emulator is ready!"
else
    echo "✅ Device/emulator already running"
fi

# Install APK
echo "📲 Installing APK..."
adb install -r app/build/outputs/apk/debug/app-debug.apk

echo "🎉 Done! App should launch on emulator."
echo ""
echo "To manually launch: adb shell am start -n com.test.project101/.MainActivity"
