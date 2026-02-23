import 'package:flutter/foundation.dart';
import 'package:hyperkyc_flutter/hyperkyc_flutter.dart';
import 'package:hyperkyc_flutter/hyperkyc_config.dart';
import 'package:hyperkyc_flutter/hyperkyc_result.dart';
import 'package:uuid/uuid.dart';
import '../config/api_config.dart';
import '../models/app_models.dart';
import '../models/token_models.dart';
import '../models/webhook_models.dart';
import '../models/sdk_models.dart';
import '../services/api_service.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// KYC PROVIDER - Central State Management
/// ═══════════════════════════════════════════════════════════════════════════

class KycProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final Uuid _uuid = const Uuid();
  
  // App State
  AppMode _mode = AppMode.defaultMode;
  AppState _state = AppState.initial;
  
  // Credentials
  String _appId = '';
  String _appKey = '';
  String _workflowId = '';
  
  // Transaction & Token
  String? _transactionId;
  String? _accessToken;
  
  // Inputs
  List<WorkflowInput> _inputs = [];
  Map<String, dynamic>? _storedInputs; // Inputs returned from backend for SDK
  
  // Results
  SdkResponse? _sdkResponse;
  WebhookResult? _webhookResult;
  OutputApiResult? _outputApiResult;
  LogsApiResult? _logsApiResult;
  
  // Error handling
  String? _error;
  bool _loading = false;
  
  // Environment
  bool _isProduction = ApiConfig.useProduction;
  
  // Getters
  AppMode get mode => _mode;
  AppState get state => _state;
  bool get isProduction => _isProduction;
  String get environment => _isProduction ? 'Production' : 'Development';
  String get environmentUrl => _isProduction ? ApiConfig.productionBaseUrl : ApiConfig.localBaseUrl;
  String get appId => _appId;
  String get appKey => _appKey;
  String get workflowId => _workflowId;
  String? get transactionId => _transactionId;
  String? get accessToken => _accessToken;
  List<WorkflowInput> get inputs => _inputs;
  SdkResponse? get sdkResponse => _sdkResponse;
  WebhookResult? get webhookResult => _webhookResult;
  OutputApiResult? get outputApiResult => _outputApiResult;
  LogsApiResult? get logsApiResult => _logsApiResult;
  String? get error => _error;
  bool get loading => _loading;
  bool get hasTransactionId => _transactionId != null && _transactionId!.isNotEmpty;
  bool get canLaunchSDK => hasTransactionId && _accessToken != null;
  bool get hasResults => _sdkResponse != null || _webhookResult != null || _outputApiResult != null || _logsApiResult != null;
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// MODE SELECTION
  /// ═════════════════════════════════════════════════════════════════════════
  
  void setMode(AppMode newMode) {
    _mode = newMode;
    _state = AppState.configuringMode;
    
    // Auto-fill credentials for default mode
    if (_mode == AppMode.defaultMode) {
      _appId = ApiConfig.defaultAppId;
      _appKey = ApiConfig.defaultAppKey;
      _workflowId = ApiConfig.defaultWorkflowId;
    } else {
      // Clear credentials for dynamic mode
      _appId = '';
      _appKey = '';
      _workflowId = '';
    }
    
    _clearResults();
    notifyListeners();
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// CREDENTIALS MANAGEMENT
  /// ═════════════════════════════════════════════════════════════════════════
  
  void setAppId(String value) {
    _appId = value.trim();
    notifyListeners();
  }
  
  void setAppKey(String value) {
    _appKey = value.trim();
    notifyListeners();
  }
  
  void setWorkflowId(String value) {
    _workflowId = value.trim();
    notifyListeners();
  }
  
  bool validateCredentials() {
    if (_mode == AppMode.defaultMode) {
      return true; // Server handles validation
    }
    
    if (_appId.isEmpty || _appKey.isEmpty || _workflowId.isEmpty) {
      _setError('Please fill in all credentials');
      return false;
    }
    
    return true;
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// TRANSACTION ID GENERATION
  /// ═════════════════════════════════════════════════════════════════════════
  
  void generateTransactionId() {
    _state = AppState.generatingTransaction;
    _transactionId = 'flutter_${_uuid.v4()}';
    _state = AppState.configuringMode;
    notifyListeners();
    
    if (kDebugMode) {
      print('📝 Generated Transaction ID: $_transactionId');
    }
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// INPUTS MANAGEMENT
  /// ═════════════════════════════════════════════════════════════════════════
  
  void addInput(WorkflowInput input) {
    _inputs.add(input);
    notifyListeners();
  }
  
  void removeInput(int index) {
    if (index >= 0 && index < _inputs.length) {
      _inputs.removeAt(index);
      notifyListeners();
    }
  }
  
  void clearInputs() {
    _inputs.clear();
    notifyListeners();
  }
  
  Map<String, dynamic> _buildInputsMap() {
    final Map<String, dynamic> inputsMap = {};
    for (var input in _inputs) {
      inputsMap[input.key] = input.value;
    }
    return inputsMap;
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// TOKEN GENERATION
  /// ═════════════════════════════════════════════════════════════════════════
  
  Future<bool> fetchAccessToken() async {
    if (!validateCredentials() || !hasTransactionId) {
      _setError('Missing required credentials or transaction ID');
      return false;
    }
    
    _setLoading(true);
    _state = AppState.fetchingToken;
    _error = null;
    notifyListeners();
    
    try {
      // Build request
      final request = TokenRequest(
        mode: _mode.value,
        transactionId: _transactionId!,
        appId: _mode == AppMode.dynamicMode ? _appId : null,
        appKey: _mode == AppMode.dynamicMode ? _appKey : null,
        workflowId: _mode == AppMode.dynamicMode ? _workflowId : null,
        inputs: _inputs.isNotEmpty ? _buildInputsMap() : null,
      );
      
      // Call API
      final response = await _apiService.generateToken(request: request);
      
      if (response.success && response.accessToken != null) {
        _accessToken = response.accessToken;
        _transactionId = response.transactionId ?? _transactionId;
        _workflowId = response.workflowId ?? _workflowId;
        _storedInputs = response.inputs; // Store inputs from backend for SDK
        
        if (kDebugMode) {
          print('✅ Access Token: ${_accessToken?.substring(0, 50)}...');
          if (_storedInputs != null) {
            print('📋 Inputs from backend: $_storedInputs');
          }
        }
        
        _state = AppState.configuringMode;
        _setLoading(false);
        notifyListeners();
        return true;
      } else {
        _setError(response.message ?? response.error ?? 'Failed to generate token');
        _setLoading(false);
        return false;
      }
    } catch (e) {
      _setError('Exception: ${e.toString()}');
      _setLoading(false);
      return false;
    }
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// SDK LAUNCH
  /// ═════════════════════════════════════════════════════════════════════════
  
  Future<bool> launchSDK() async {
    if (_accessToken == null || _workflowId.isEmpty || _transactionId == null) {
      _setError('Missing access token, workflow ID, or transaction ID');
      return false;
    }
    
    _state = AppState.launchingSDK;
    _error = null;
    notifyListeners();
    
    try {
      if (kDebugMode) {
        print('🚀 Launching SDK with:');
        print('   - App ID: $_appId');
        print('   - Workflow ID: $_workflowId');
        print('   - Transaction ID: $_transactionId');
      }
      
      _state = AppState.sdkInProgress;
      notifyListeners();
      
      // Create HyperKYC config using appId and appKey
      var hyperKycConfig = HyperKycConfig.fromAppIdAppKey(
        appId: _appId.isNotEmpty ? _appId : ApiConfig.defaultAppId,
        appKey: _appKey.isNotEmpty ? _appKey : ApiConfig.defaultAppKey,
        workflowId: _workflowId,
        transactionId: _transactionId,
      );
      
      // Set inputs if available from backend response
      if (_storedInputs != null && _storedInputs!.isNotEmpty) {
        hyperKycConfig.setInputs(inputs: _storedInputs!);
        if (kDebugMode) {
          print('📋 Setting inputs from backend: $_storedInputs');
        }
      }
      
      // Launch HyperKYC SDK
      final HyperKycResult result = await HyperKyc.launch(
        hyperKycConfig: hyperKycConfig,
      );
      
      // Store SDK response
      _sdkResponse = SdkResponse.fromHyperKycResult(result);
      _state = AppState.sdkCompleted;
      
      if (kDebugMode) {
        print('✅ SDK Result: ${_sdkResponse?.status}');
        print('   - Transaction ID: ${_sdkResponse?.transactionId}');
      }
      
      notifyListeners();
      return true;
    } catch (e) {
      _setError('SDK Launch Error: ${e.toString()}');
      _state = AppState.error;
      notifyListeners();
      return false;
    }
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// FETCH WEBHOOK RESULTS
  /// ═════════════════════════════════════════════════════════════════════════
  
  Future<bool> fetchWebhookResults() async {
    if (_transactionId == null) {
      _setError('No transaction ID available');
      return false;
    }
    
    _setLoading(true);
    _state = AppState.fetchingResults;
    notifyListeners();
    
    try {
      final response = await _apiService.getWebhookResults(
        transactionId: _transactionId!,
      );
      
      if (response.success && response.data != null) {
        _webhookResult = response.data;
        
        if (kDebugMode) {
          print('✅ Webhook Result: ${_webhookResult?.status}');
        }
        
        _state = AppState.completed;
        _setLoading(false);
        notifyListeners();
        return true;
      } else {
        _setError(response.message ?? 'No webhook data found');
        _setLoading(false);
        return false;
      }
    } catch (e) {
      _setError('Webhook Fetch Error: ${e.toString()}');
      _setLoading(false);
      return false;
    }
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// FETCH OUTPUT API RESULTS
  /// ═════════════════════════════════════════════════════════════════════════
  
  Future<bool> fetchOutputApiResults() async {
    if (_transactionId == null) {
      _setError('No transaction ID available');
      return false;
    }
    
    _setLoading(true);
    notifyListeners();
    
    try {
      final result = await _apiService.getOutputApiResults(
        transactionId: _transactionId!,
        workflowId: _workflowId.isNotEmpty ? _workflowId : null,
      );
      
      _outputApiResult = result;
      
      if (kDebugMode) {
        print('✅ Output API Result: ${result.status}');
      }
      
      _setLoading(false);
      notifyListeners();
      return result.success;
    } catch (e) {
      _outputApiResult = OutputApiResult(
        success: false,
        error: 'EXCEPTION',
        message: e.toString(),
      );
      _setLoading(false);
      notifyListeners();
      return false;
    }
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// FETCH LOGS API RESULTS
  /// ═════════════════════════════════════════════════════════════════════════
  
  Future<bool> fetchLogsApiResults() async {
    if (_transactionId == null) {
      _setError('No transaction ID available');
      return false;
    }
    
    _setLoading(true);
    notifyListeners();
    
    try {
      final result = await _apiService.getLogsApiResults(
        transactionId: _transactionId!,
        workflowId: _workflowId.isNotEmpty ? _workflowId : null,
      );
      
      _logsApiResult = result;
      
      if (kDebugMode) {
        print('✅ Logs API Result: ${result.appStatus}, modules: ${result.modules.length}');
      }
      
      _setLoading(false);
      notifyListeners();
      return result.success;
    } catch (e) {
      _logsApiResult = LogsApiResult(
        success: false,
        modules: [],
        error: 'EXCEPTION',
        message: e.toString(),
      );
      _setLoading(false);
      notifyListeners();
      return false;
    }
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// RESET & UTILITY
  /// ═════════════════════════════════════════════════════════════════════════
  
  void startNewFlow() {
    _state = AppState.initial;
    _transactionId = null;
    _accessToken = null;
    _inputs.clear();
    _clearResults();
    notifyListeners();
    
    if (kDebugMode) {
      print('🔄 Started new flow');
    }
  }
  
  void resetAll() {
    _mode = AppMode.defaultMode;
    _state = AppState.initial;
    _appId = '';
    _appKey = '';
    _workflowId = '';
    _transactionId = null;
    _accessToken = null;
    _inputs.clear();
    _storedInputs = null;
    _clearResults();
    _error = null;
    _loading = false;
    notifyListeners();
    
    if (kDebugMode) {
      print('🔄 Full reset completed');
    }
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// ENVIRONMENT SWITCHING
  /// ═════════════════════════════════════════════════════════════════════════
  
  Future<Map<String, dynamic>> switchEnvironment(bool toProduction) async {
    _setLoading(true);
    
    try {
      // Determine target URL
      final targetUrl = toProduction 
          ? ApiConfig.productionBaseUrl 
          : ApiConfig.localBaseUrl;
      final environmentName = toProduction ? 'Production' : 'Development';
      
      if (kDebugMode) {
        print('🔄 Switching to $environmentName environment: $targetUrl');
      }
      
      // Check if environment is available
      final healthCheck = await _apiService.checkEnvironment(targetUrl);
      
      if (healthCheck['available'] == true) {
        // Environment is available, switch to it
        _isProduction = toProduction;
        ApiConfig.setEnvironment(toProduction);
        
        // Refresh ApiService to use new base URL
        _apiService.refreshBaseUrl();
        
        if (kDebugMode) {
          print('✅ Switched to $environmentName environment');
        }
        
        _setLoading(false);
        notifyListeners();
        
        return {
          'success': true,
          'message': 'Switched to $environmentName environment',
          'environment': environmentName,
          'url': targetUrl,
        };
      } else {
        // Environment is not available
        _setLoading(false);
        
        return {
          'success': false,
          'message': healthCheck['message'] ?? 'Environment not available',
          'environment': environmentName,
          'url': targetUrl,
        };
      }
    } catch (e) {
      _setLoading(false);
      
      return {
        'success': false,
        'message': 'Failed to switch environment: ${e.toString()}',
      };
    }
  }
  
  void _clearResults() {
    _sdkResponse = null;
    _webhookResult = null;
    _outputApiResult = null;
    _logsApiResult = null;
    _error = null;
  }
  
  void _setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }
  
  void _setError(String message) {
    _error = message;
    _state = AppState.error;
    notifyListeners();
    
    if (kDebugMode) {
      print('❌ Error: $message');
    }
  }
  
  void clearError() {
    _error = null;
    if (_state == AppState.error) {
      _state = AppState.initial;
    }
    notifyListeners();
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// HEALTH CHECK
  /// ═════════════════════════════════════════════════════════════════════════
  
  Future<bool> checkServerHealth() async {
    return await _apiService.checkHealth();
  }
}
