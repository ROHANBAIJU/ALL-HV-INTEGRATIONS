# 🚀 UNIFIED BACKEND - QUICK START GUIDE

## ⚡ Quick Setup (5 minutes)

### Step 1: Install Dependencies
```powershell
cd Z:\ALL-HV-INTEGRATIONS\UNIFIED-BACKEND
npm install
```

### Step 2: Configure Environment
```powershell
# Copy example environment file
cp .env.example .env
```

The `.env` is already configured with your default credentials:
```
DEFAULT_APP_ID=c52h5j
DEFAULT_APP_KEY=HV:q7aqkdhe5b39vfmeg
DEFAULT_WORKFLOW_ID=rb_sureguard_insurance
```

### Step 3: Start Server
```powershell
npm run dev
```

### Step 4: Test Endpoints
```powershell
# In a new terminal
.\test-endpoints.ps1
```

---

## 📱 Connect to Apps

### Android App Configuration

Update your Android app's `build.gradle.kts`:

```kotlin
buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")  // Emulator
// OR
buildConfigField("String", "API_BASE_URL", "\"http://192.168.x.x:3000\"")  // Physical device
```

### Flutter App Configuration

Update `lib/config/api_config.dart`:

```dart
static const String baseUrl = 'http://10.0.2.2:3000';  // Android Emulator
// OR
static const String baseUrl = 'http://localhost:3000';  // iOS Simulator
// OR
static const String baseUrl = 'http://192.168.x.x:3000';  // Physical device
```

---

## 🎯 Key Features

### 1. Default Mode (Recommended for Testing)
- Mobile app sends only: `mode: "default"` + `transactionId`
- Backend uses its stored credentials
- ✅ Most secure - no credentials in mobile apps

### 2. Dynamic Mode
- Mobile app sends: `mode: "dynamic"` + credentials + `transactionId`
- Backend uses provided credentials
- ⚠️ Use with caution - credentials in app request

### 3. File Upload Support
- Upload files for workflow inputs
- Files converted to URLs
- Supports JPEG, PNG, PDF (max 10MB)

### 4. Webhook Integration
- Receives results from HyperVerge
- Stores results in memory (use DB in production)
- Query results by transaction ID

---

## 📡 API Examples

### Generate Token (Default Mode)
```bash
curl -X POST http://localhost:3000/api/token/generate \
  -H "Content-Type: application/json" \
  -H "X-Platform: Android" \
  -d '{
    "mode": "default",
    "transactionId": "txn_user123_1708598400"
  }'
```

### Upload File
```bash
curl -X POST http://localhost:3000/api/files/upload \
  -F "file=@document.jpg" \
  -F "key=document"
```

### Query Webhook Result
```bash
curl http://localhost:3000/api/webhook/results/txn_user123_1708598400
```

---

## 🐛 Troubleshooting

### "Port 3000 already in use"
```powershell
npx kill-port 3000
npm run dev
```

### "Cannot reach backend from mobile app"
1. Check firewall allows port 3000
2. Use correct IP address (check with `ipconfig`)
3. Android emulator: Use `10.0.2.2` (not `localhost`)
4. iOS simulator: Use `localhost`
5. Physical device: Use your computer's IP on same WiFi

### "Token generation fails"
1. Check `.env` file has correct credentials
2. Verify credentials in HyperVerge dashboard
3. Check internet connection
4. Check server logs for detailed error

---

## 🚀 What's Next?

1. ✅ Backend is ready!
2. 🔄 Update Android app to connect to this backend
3. 🔄 Update Flutter app to connect to this backend
4. 🎨 Redesign both apps with modern UI
5. 📁 Add file upload UI in both apps
6. 🚀 Deploy backend to Vercel/Heroku

---

## 📞 Need Help?

Check the detailed README.md for full API documentation.

**Made with ❤️ by Rohan Baiju**
