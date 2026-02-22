# 🚀 UNIFIED HYPERVERGE BACKEND

A unified Node.js/Express backend that serves **BOTH Android and Flutter applications** for HyperVerge SDK integration.

## ✨ Features

- 🎛️ **Dual Mode Support**
  - **Default Mode**: Uses server-stored credentials
  - **Dynamic Mode**: Accepts custom credentials from client apps
  
- 📱 **Cross-Platform Compatible**
  - Android (Kotlin/Jetpack Compose)
  - Flutter (Dart/Material Design 3)
  
- 🔐 **Secure Token Generation**
  - Access token-based authentication
  - No credentials exposed in mobile apps (Default mode)
  
- 🔔 **Webhook Integration**
  - Receives verification results from HyperVerge
  - Stores results for query
  - Can trigger business logic
  
- 📁 **File Upload Support**
  - Upload files for workflow inputs
  - Supports images (JPEG, PNG) and PDFs
  - Converts to URLs for SDK integration
  
- 🚀 **Vercel-Ready**
  - Serverless deployment configuration included
  - Easy cloud deployment

---

## 📋 Quick Start

### 1. Install Dependencies

```bash
cd UNIFIED-BACKEND
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your credentials
```

Edit `.env`:
```env
DEFAULT_APP_ID=c52h5j
DEFAULT_APP_KEY=HV:q7aqkdhe5b39vfmeg
DEFAULT_WORKFLOW_ID=rb_sureguard_insurance
PORT=3000
```

### 3. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3000`

---

## 📡 API Endpoints

### 🏥 Health & Info

#### GET `/`
Server information and status

**Response:**
```json
{
  "status": "online",
  "service": "Unified HyperVerge Backend",
  "version": "2.0.0",
  "platforms": ["Android", "Flutter"],
  "endpoints": { ... }
}
```

#### GET `/health`
Health check

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-22T10:30:00.000Z",
  "uptime": 3600
}
```

#### GET `/api/server-ip`
Get server's outbound IP (for HyperVerge whitelist)

**Response:**
```json
{
  "success": true,
  "ip": "203.0.113.45",
  "message": "Add this IP to HyperVerge dashboard whitelist"
}
```

---

### 🔑 Token Generation

#### POST `/api/token/generate`
Generate access token for SDK initialization

**Request Headers:**
```
Content-Type: application/json
X-Platform: Android | Flutter (optional)
```

**Request Body (Default Mode):**
```json
{
  "mode": "default",
  "transactionId": "txn_user123_1708598400"
}
```

**Request Body (Dynamic Mode):**
```json
{
  "mode": "dynamic",
  "transactionId": "txn_user456_1708598400",
  "appId": "your_app_id",
  "appKey": "HV:your_app_key",
  "workflowId": "your_workflow_id",
  "inputs": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "workflowId": "rb_sureguard_insurance",
  "transactionId": "txn_user123_1708598400",
  "mode": "default",
  "expiresIn": 43200,
  "timestamp": "2026-02-22T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid mode",
  "message": "Mode must be either 'default' or 'dynamic'",
  "code": "INVALID_MODE"
}
```

---

### 🔔 Webhook Endpoints

#### POST `/api/webhook/results`
Receive verification results from HyperVerge

**Note:** This endpoint is called by HyperVerge servers. Configure this URL in your HyperVerge dashboard.

**Request Body (sent by HyperVerge):**
```json
{
  "transactionId": "txn_user123_1708598400",
  "workflowId": "rb_sureguard_insurance",
  "status": "auto_approved",
  "result": {
    "summary": { ... },
    "details": { ... }
  },
  "timestamp": "2026-02-22T10:35:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "transactionId": "txn_user123_1708598400"
}
```

#### GET `/api/webhook/results/:transactionId`
Query stored verification results

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_user123_1708598400",
    "status": "auto_approved",
    "workflowId": "rb_sureguard_insurance",
    "result": { ... },
    "timestamp": "2026-02-22T10:35:00.000Z",
    "receivedAt": "2026-02-22T10:35:01.000Z"
  }
}
```

#### GET `/api/webhook/results`
Get all stored results (debugging)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "results": [ ... ]
}
```

---

### 📁 File Upload Endpoints

#### POST `/api/files/upload`
Upload a file for workflow input

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file`: The file to upload
- `key`: Workflow input key (optional)

**Example (curl):**
```bash
curl -X POST http://localhost:3000/api/files/upload \
  -F "file=@document.jpg" \
  -F "key=document"
```

**Response:**
```json
{
  "success": true,
  "file": {
    "filename": "document-1708598400.jpg",
    "originalName": "document.jpg",
    "url": "http://localhost:3000/uploads/document-1708598400.jpg",
    "size": 245678,
    "mimetype": "image/jpeg",
    "key": "document",
    "uploadedAt": "2026-02-22T10:30:00.000Z"
  },
  "message": "File uploaded successfully"
}
```

#### POST `/api/files/upload-multiple`
Upload multiple files at once

**Form Fields:**
- `files`: Array of files
- `key_0`, `key_1`, etc.: Keys for each file

**Response:**
```json
{
  "success": true,
  "count": 3,
  "files": [ ... ],
  "message": "3 files uploaded successfully"
}
```

#### DELETE `/api/files/:filename`
Delete an uploaded file

**Response:**
```json
{
  "success": true,
  "message": "File document-1708598400.jpg deleted successfully"
}
```

---

## 🎯 Usage Examples

### Android (Kotlin)

```kotlin
// Token generation request
val requestBody = if (isDefaultMode) {
    JSONObject().apply {
        put("mode", "default")
        put("transactionId", transactionId)
    }
} else {
    JSONObject().apply {
        put("mode", "dynamic")
        put("transactionId", transactionId)
        put("appId", appId)
        put("appKey", appKey)
        put("workflowId", workflowId)
    }
}

// Add platform header
val request = Request.Builder()
    .url("http://your-server:3000/api/token/generate")
    .addHeader("X-Platform", "Android")
    .post(requestBody.toString().toRequestBody("application/json".toMediaType()))
    .build()
```

### Flutter (Dart)

```dart
// Token generation request
final response = await http.post(
  Uri.parse('http://your-server:3000/api/token/generate'),
  headers: {
    'Content-Type': 'application/json',
    'X-Platform': 'Flutter',
  },
  body: jsonEncode({
    'mode': isDefaultMode ? 'default' : 'dynamic',
    'transactionId': transactionId,
    if (!isDefaultMode) ...{
      'appId': appId,
      'appKey': appKey,
      'workflowId': workflowId,
    }
  }),
);
```

---

## 🧪 Testing

### Test Endpoints Script

```bash
npm test
```

Or manually:

```bash
# Health check
curl http://localhost:3000/health

# Generate token (default mode)
curl -X POST http://localhost:3000/api/token/generate \
  -H "Content-Type: application/json" \
  -H "X-Platform: Test" \
  -d '{
    "mode": "default",
    "transactionId": "txn_test_123"
  }'

# Generate token (dynamic mode)
curl -X POST http://localhost:3000/api/token/generate \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "dynamic",
    "transactionId": "txn_test_456",
    "appId": "test_app_id",
    "appKey": "HV:test_app_key",
    "workflowId": "test_workflow"
  }'
```

---

## 🚀 Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - DEFAULT_APP_ID
# - DEFAULT_APP_KEY
# - DEFAULT_WORKFLOW_ID
# - BASE_URL (your vercel URL)
```

### Other Platforms

- **Heroku**: Add `Procfile` with `web: node server.js`
- **AWS/GCP**: Deploy as Node.js application
- **Docker**: Create Dockerfile (example available on request)

---

## 📂 Project Structure

```
UNIFIED-BACKEND/
├── server.js                    # Main server file
├── package.json                 # Dependencies
├── .env.example                 # Environment template
├── vercel.json                  # Vercel config
├── controllers/
│   ├── tokenController.js       # Token generation logic
│   ├── webhookController.js     # Webhook handling
│   └── fileController.js        # File upload logic
├── routes/
│   ├── tokenRoutes.js           # Token routes
│   ├── webhookRoutes.js         # Webhook routes
│   └── fileRoutes.js            # File routes
└── uploads/                     # Uploaded files storage
    └── .gitkeep
```

---

## 🔒 Security Best Practices

1. **Never expose credentials in client apps** - Use Default mode
2. **Use HTTPS in production** - Deploy with SSL certificate
3. **Validate webhook signatures** - If HyperVerge provides signing
4. **Rate limiting** - Add rate limiting for production
5. **File validation** - Validate file types and sizes
6. **Input sanitization** - Sanitize all user inputs
7. **Environment variables** - Never commit .env to version control

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Cannot Reach HyperVerge API
- Check internet connection
- Verify credentials are correct
- Check if IP is whitelisted in HyperVerge dashboard

### File Upload Fails
- Check uploads directory exists and has write permissions
- Verify file size is within limits (10MB)
- Check file type is allowed (JPEG, PNG, PDF)

---

## 📞 Support

For issues or questions:
- Check HyperVerge documentation
- Review API error codes
- Check server logs
- Contact: Rohan Baiju - Integration Engineer

---

## 📄 License

MIT License - See LICENSE file

---

**Made with ❤️ by Rohan Baiju**  
**February 2026**
