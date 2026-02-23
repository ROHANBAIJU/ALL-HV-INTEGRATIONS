/// ═══════════════════════════════════════════════════════════════════════════
/// API CONFIGURATION
/// ═══════════════════════════════════════════════════════════════════════════

class ApiConfig {
  // ═══════════════════════════════════════════════════════════════════════════
  // BACKEND CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Switch between local and production backend
  static bool _useProduction = false;
  
  /// Local backend URL
  /// - Android Emulator: 10.0.2.2
  /// - iOS Simulator: localhost
  /// - Physical Device: Your computer's IP (run ipconfig)
  static const String localBaseUrl = 'http://192.168.0.105:3000';
  
  /// Production backend URL (Vercel Deployment)
  /// Project: unified-backend-for-all-sdks
  /// Note: If you get 401 errors, disable password protection in Vercel Dashboard:
  /// Settings → Deployment Protection → Disable "Vercel Authentication"
  static const String productionBaseUrl = 'https://unified-backend-for-all-sdks-p1bb4tasc.vercel.app';
  
  /// Active base URL
  static String get baseUrl => _useProduction ? productionBaseUrl : localBaseUrl;
  
  /// Get current environment
  static bool get useProduction => _useProduction;
  
  /// Set environment
  static void setEnvironment(bool production) {
    _useProduction = production;
  }
  
  /// Get environment name
  static String get environmentName => _useProduction ? 'Production' : 'Development';
  
  /// Get environment URL
  static String get environmentUrl => baseUrl;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // API ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Token generation endpoint
  static const String tokenGenerate = '/api/token/generate';
  
  /// Webhook results endpoint
  static const String webhookResults = '/api/webhook/results';
  
  /// Output API endpoint (proxy to HV Output API)
  static const String outputApi = '/api/results/output';
  
  /// Logs API endpoint (proxy to HV Logs API)
  static const String logsApi = '/api/results/logs';
  
  /// File upload endpoint
  static const String fileUpload = '/api/files/upload';
  
  /// Server health check
  static const String health = '/health';
  
  // ═══════════════════════════════════════════════════════════════════════════
  // COMPLETE URLS
  // ═══════════════════════════════════════════════════════════════════════════
  
  static String get tokenGenerateUrl => '$baseUrl$tokenGenerate';
  static String webhookResultsUrl(String transactionId) => 
      '$baseUrl$webhookResults/$transactionId';
  static String get webhookResultsBaseUrl => '$baseUrl$webhookResults';
  static String get outputApiUrl => '$baseUrl$outputApi';
  static String get logsApiUrl => '$baseUrl$logsApi';
  static String get fileUploadUrl => '$baseUrl$fileUpload';
  static String get healthUrl => '$baseUrl$health';
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DEFAULT CREDENTIALS (for Default Mode)
  // ═══════════════════════════════════════════════════════════════════════════
  
  static const String defaultAppId = 'c52h5j';
  static const String defaultAppKey = 'HV:q7aqkdhe5b39vfmeg';
  static const String defaultWorkflowId = 'rb_sureguard_insurance';
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TIMEOUTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HEADERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    'X-Platform': 'Flutter',
  };
}
