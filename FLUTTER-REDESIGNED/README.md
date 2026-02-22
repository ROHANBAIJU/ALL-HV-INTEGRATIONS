# HyperKYC Flutter - Redesigned App

Modern Flutter app for HyperKYC SDK integration with dual-mode authentication and comprehensive results dashboard.

## 🎯 Features

### Dual Authentication Modes
- **Default Mode**: Uses server-stored credentials (recommended)
- **Dynamic Mode**: Allows custom credential input at runtime

### Transaction Management
- UUID-based transaction ID generation
- Pre-SDK transaction generation for better tracking
- Transaction ID visibility throughout the flow

### Comprehensive Results Dashboard
Three-tab results interface:
1. **SDK Response Tab**: Real-time SDK execution results
2. **Outputs API Tab**: Auto-fetches webhook results from backend
3. **Webhooks Tab**: Listen for finish_transaction events with manual refresh

### Modern UI/UX
- Dark theme with purple/orange gradient
- Material Design 3 components
- Smooth animations and transitions
- Loading states and error handling
- Clipboard copy functionality for JSON data

## 🏗️ Architecture

```
lib/
├── config/
│   ├── api_config.dart           # API endpoints & credentials
│   └── app_theme.dart             # Theme configuration
├── models/
│   ├── app_models.dart            # App state & mode enums
│   ├── sdk_models.dart            # SDK response models
│   ├── token_models.dart          # Token request/response
│   └── webhook_models.dart        # Webhook result models
├── providers/
│   └── kyc_provider.dart          # Central state management
├── screens/
│   ├── home_screen.dart           # Mode selection & config
│   └── results_dashboard_screen.dart  # 3-tab results view
├── services/
│   └── api_service.dart           # HTTP client with Dio
└── main.dart                      # App entry point
```

## 🚀 Getting Started

### Prerequisites
- Flutter SDK 3.0+
- Dart 3.0+
- Backend server running on `http://localhost:3000`

### Installation

1. **Install Dependencies**
   ```bash
   cd FLUTTER-REDESIGNED
   flutter pub get
   ```

2. **Configure Backend URL**
   - Android Emulator: Uses `http://10.0.2.2:3000` (pre-configured)
   - iOS Simulator: Change to `http://localhost:3000` in `lib/config/api_config.dart`
   - Physical Device: Update to your machine's IP address

3. **Run the App**
   ```bash
   flutter run
   ```

## 📱 Usage Flow

### Default Mode (Recommended)
1. Select "Default Mode" on home screen
2. Click "Generate Transaction ID"
3. Click "Initialize Workflow"
4. SDK launches automatically
5. View results in 3-tab dashboard

### Dynamic Mode
1. Select "Dynamic Mode"
2. Enter custom credentials:
   - App ID
   - App Key
   - Workflow ID
3. Click "Generate Transaction ID"
4. Click "Initialize Workflow"
5. SDK launches with custom credentials
6. View results in 3-tab dashboard

### Results Dashboard

**Tab 1: SDK Response**
- Shows real-time SDK execution status
- Displays transaction ID, status, timestamp
- Error details (if any)
- Additional SDK details in JSON format

**Tab 2: Outputs API**
- Auto-triggers after SDK completion
- Fetches webhook results from backend
- Shows webhook data received by server
- Raw JSON data viewer with copy functionality

**Tab 3: Webhooks**
- Explains webhook flow
- Manual "Call Results API" button
- Displays latest webhook results
- Shows finish_transaction event status

## 🔧 Configuration

### Default Credentials
Located in `lib/config/api_config.dart`:
```dart
static const String defaultAppId = 'c52h5j';
static const String defaultAppKey = 'HV:q7aqkdhe5b39vfmeg';
static const String defaultWorkflowId = 'rb_sureguard_insurance';
```

### API Endpoints
- **Token Generation**: `POST /api/token/generate`
- **Webhook Results**: `GET /api/webhook/results/:transactionId`
- **File Upload**: `POST /api/files/upload`
- **Health Check**: `GET /health`

### Theme Customization
Edit `lib/config/app_theme.dart` to customize colors:
- Primary Purple: `#6C5CE7`
- Accent Orange: `#FF8A65`
- Success Green: `#00E676`
- Error Red: `#FF5252`

## 🧪 Testing

### Manual Testing Checklist
- [ ] Default mode token generation
- [ ] Dynamic mode with custom credentials
- [ ] Transaction ID generation
- [ ] SDK launch
- [ ] Results display in all 3 tabs
- [ ] "Start Another Flow" functionality
- [ ] Error handling
- [ ] Network error recovery

### Backend Health Check
The app automatically checks backend health on startup. Ensure backend is running before testing.

## 📦 Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  hyperkyc_flutter: ^2.0.0    # HyperVerge SDK
  provider: ^6.1.1             # State management
  dio: ^5.4.0                  # HTTP client
  file_picker: ^6.1.1          # File selection
  uuid: ^4.3.3                 # Transaction ID generation
  http: ^1.2.0                 # HTTP utilities
  flutter_spinkit: ^5.2.0      # Loading animations
  font_awesome_flutter: ^10.6.0 # Icons
  shared_preferences: ^2.2.2   # Local storage
  intl: ^0.19.0                # Date formatting
```

## 🔗 Backend Integration

This app connects to the unified backend server. Ensure the backend is running:

```bash
cd ../UNIFIED-BACKEND
npm install
node server.js
```

Backend should be accessible at `http://localhost:3000`

## 🐛 Troubleshooting

### Common Issues

**1. Network Error: Connection Refused**
- Ensure backend is running on port 3000
- Check `api_config.dart` baseUrl for correct IP
- For Android emulator, use `10.0.2.2` instead of `localhost`

**2. SDK Launch Fails**
- Verify credentials are correct
- Check transaction ID was generated
- Ensure access token was fetched successfully

**3. Webhook Results Not Found**
- Wait a few seconds after SDK completion
- Manually trigger "Call Results API" in Webhooks tab
- Check backend logs for webhook reception

**4. Build Errors**
- Run `flutter clean && flutter pub get`
- Ensure Flutter SDK is up to date
- Check for dependency conflicts

## 📄 License

This project is part of the HyperVerge integration suite.

## 🤝 Support

For issues or questions:
1. Check backend server logs
2. Enable debug mode in `api_service.dart`
3. Review SDK documentation
4. Contact HyperVerge support

---

**Built with Flutter 💙**
