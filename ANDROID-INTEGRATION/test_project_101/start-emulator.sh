#!/bin/bash
# Simple script to just start the emulator

export ANDROID_HOME=~/Library/Android/sdk

echo "🚀 Starting Android Emulator: Medium_Phone_API_36.1"
$ANDROID_HOME/emulator/emulator -avd Medium_Phone_API_36.1 -no-snapshot-load &

echo "⏳ Emulator starting in background..."
echo "Check status with: adb devices"
