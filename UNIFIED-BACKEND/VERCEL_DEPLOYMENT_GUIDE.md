# Vercel Deployment Guide - unified-backend-for-all-sdks

## ✅ Deployment Status

**Project Name:** unified-backend-for-all-sdks  
**Production URL:** https://unified-backend-for-all-sdks-d76nz9uok.vercel.app  
**Status:** ✅ Deployed & Ready

---

## 📋 Environment Variables Configured

The following environment variables have been added to production:

- ✅ `DEFAULT_APP_ID` = c52h5j
- ✅ `DEFAULT_APP_KEY` = HV:q7aqkdhe5b39vfmeg
- ✅ `DEFAULT_WORKFLOW_ID` = rb_sureguard_insurance

---

## 🔓 IMPORTANT: Disable Password Protection

Vercel adds password protection by default to new projects. You need to disable it for the mobile app to access the API.

### Steps to Disable:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: **unified-backend-for-all-sdks**
3. Navigate to: **Settings** → **Deployment Protection**
4. Find: **"Vercel Authentication"** or **"Password Protection"**
5. **Disable** the protection
6. Save changes

**Why?** Mobile apps cannot authenticate with browser-based password protection. The API needs to be publicly accessible.

---

## 🧪 Testing the Deployed Backend

### Test Health Endpoint

```powershell
Invoke-RestMethod -Uri "https://unified-backend-for-all-sdks-d76nz9uok.vercel.app/health" -Method Get
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Unified HyperVerge Backend is running!",
  "timestamp": "2026-02-22T...",
  "version": "2.0.0",
  "endpoints": { ... }
}
```

### Test Token Generation (Default Mode)

```powershell
$body = @{
    mode = 'default'
    transactionId = 'test_flutter_123'
} | ConvertTo-Json

$headers = @{
    'Content-Type' = 'application/json'
    'X-Platform' = 'flutter'
}

Invoke-RestMethod -Uri "https://unified-backend-for-all-sdks-d76nz9uok.vercel.app/api/token/generate" -Method POST -Body $body -Headers $headers
```

**Expected Response:**
```json
{
  "success": true,
  "accessToken": "eyJ0eXAiOiJKV1QiLCJ...",
  "workflowId": "rb_sureguard_insurance",
  "transactionId": "test_flutter_123",
  "expiresIn": 3600,
  "inputs": {
    "MANUALNAME": ""
  }
}
```

---

## 🔄 Redeploying

To redeploy with changes:

```bash
cd Z:\ALL-HV-INTEGRATIONS\UNIFIED-BACKEND
vercel --prod
```

---

## 📱 Flutter App Integration

The Flutter app (`FLUTTER-REDESIGNED`) has been configured with:

**File:** `lib/config/api_config.dart`

```dart
static const bool useProduction = false; // Set to true to use Vercel
static const String productionBaseUrl = 'https://unified-backend-for-all-sdks-d76nz9uok.vercel.app';
```

### To Switch to Production:

Change `useProduction` to `true` in [api_config.dart](z:/ALL-HV-INTEGRATIONS/FLUTTER-REDESIGNED/lib/config/api_config.dart#L10):

```dart
static const bool useProduction = true; // ✅ Use Vercel backend
```

Then rebuild the Flutter app:

```bash
flutter clean
flutter pub get
flutter run
```

---

## 🌐 Endpoints Available

All endpoints are prefixed with the base URL: `https://unified-backend-for-all-sdks-d76nz9uok.vercel.app`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Server info & documentation |
| `/health` | GET | Health check |
| `/api/token/generate` | POST | Generate access token (default/dynamic) |
| `/api/webhook/receive` | POST | Receive HyperVerge webhooks |
| `/api/webhook/results/:transactionId` | GET | Get webhook results |
| `/api/files/upload` | POST | Upload files |

---

## 🐛 Troubleshooting

### Issue: Getting 401 Unauthorized

**Cause:** Vercel password protection is enabled  
**Solution:** Follow the steps in "Disable Password Protection" above

### Issue: Environment variables not working

**Solution:** Redeploy the project after adding environment variables:
```bash
vercel --prod
```

### Issue: CORS errors from mobile app

**Solution:** Backend is already configured to accept all origins. Ensure the mobile app sends proper headers:
- `Content-Type: application/json`
- `X-Platform: Flutter` or `X-Platform: Android`

---

## 📊 Monitoring

View deployment logs and analytics:
- **Dashboard:** https://vercel.com/rohanbaiju210-gmailcoms-projects/unified-backend-for-all-sdks
- **Logs:** Available in the Vercel dashboard under "Deployments" → Select deployment → "Logs"

---

## 🔐 Security Notes

- ✅ Environment variables are securely stored in Vercel
- ✅ CORS is configured for mobile app access
- ⚠️ Password protection must be disabled for API access
- ✅ HTTPS is automatically enabled by Vercel

---

## 📝 Deployment History

| Date | URL | Status |
|------|-----|--------|
| 2026-02-22 | https://unified-backend-for-all-sdks-d76nz9uok.vercel.app | ✅ Active (Production) |
| 2026-02-22 | https://unified-backend-for-all-sdks-i3txw32qc.vercel.app | ⏸️ Previous |

---

**Deployed by:** Rohan Baiju  
**Date:** February 22, 2026  
**CLI Version:** Vercel CLI 48.9.2
