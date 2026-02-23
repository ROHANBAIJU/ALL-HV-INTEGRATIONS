import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import '../models/token_models.dart';
import '../models/webhook_models.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// API SERVICE - Handles all backend communication
/// ═══════════════════════════════════════════════════════════════════════════

class ApiService {
  late Dio _dio;
  
  ApiService() {
    _initializeDio();
  }
  
  void _initializeDio() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: ApiConfig.connectTimeout,
        receiveTimeout: ApiConfig.receiveTimeout,
        headers: ApiConfig.headers,
      ),
    );
    
    // Add interceptors for logging
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (kDebugMode) {
            print('🚀 REQUEST: ${options.method} ${options.uri}');
            print('📦 DATA: ${options.data}');
          }
          handler.next(options);
        },
        onResponse: (response, handler) {
          if (kDebugMode) {
            print('✅ RESPONSE: ${response.statusCode} ${response.requestOptions.uri}');
            print('📥 DATA: ${response.data}');
          }
          handler.next(response);
        },
        onError: (error, handler) {
          if (kDebugMode) {
            print('❌ ERROR: ${error.message}');
            print('📍 URL: ${error.requestOptions.uri}');
            print('🔍 RESPONSE: ${error.response?.data}');
          }
          handler.next(error);
        },
      ),
    );
  }
  
  /// Reinitialize Dio with new base URL (called when environment switches)
  void refreshBaseUrl() {
    _initializeDio();
    if (kDebugMode) {
      print('🔄 ApiService reinitialized with baseUrl: ${ApiConfig.baseUrl}');
    }
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// HEALTH CHECK
  /// ═════════════════════════════════════════════════════════════════════════
  
  Future<bool> checkHealth({String? baseUrl}) async {
    try {
      final url = baseUrl != null ? '$baseUrl/health' : ApiConfig.healthUrl;
      final response = await _dio.get(url);
      return response.statusCode == 200;
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Health check failed: $e');
      }
      return false;
    }
  }
  
  /// Check if specific environment is available
  Future<Map<String, dynamic>> checkEnvironment(String baseUrl) async {
    try {
      final dio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 5),
      ));
      
      final response = await dio.get('$baseUrl/health');
      
      if (response.statusCode == 200) {
        return {
          'available': true,
          'message': 'Environment is available',
          'data': response.data,
        };
      } else {
        return {
          'available': false,
          'message': 'Server returned ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'available': false,
        'message': e.toString().contains('SocketException') 
            ? 'Cannot connect to server. Please check if the backend is running.'
            : 'Failed to connect: ${e.toString()}',
      };
    }
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// TOKEN GENERATION
  /// ═════════════════════════════════════════════════════════════════════════
  
  Future<TokenResponse> generateToken({
    required TokenRequest request,
  }) async {
    try {
      final response = await _dio.post(
        ApiConfig.tokenGenerate,
        data: request.toJson(),
      );
      
      if (response.statusCode == 200) {
        return TokenResponse.fromJson(response.data);
      } else {
        return TokenResponse(
          success: false,
          error: 'HTTP ${response.statusCode}',
          message: response.statusMessage ?? 'Unknown error',
        );
      }
    } on DioException catch (e) {
      return TokenResponse(
        success: false,
        error: e.type.toString(),
        message: e.message ?? 'Network error occurred',
        code: e.response?.statusCode?.toString(),
      );
    } catch (e) {
      return TokenResponse(
        success: false,
        error: 'EXCEPTION',
        message: e.toString(),
      );
    }
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// WEBHOOK RESULTS
  /// ═════════════════════════════════════════════════════════════════════════
  
  Future<WebhookQueryResponse> getWebhookResults({
    required String transactionId,
  }) async {
    try {
      final url = '${ApiConfig.webhookResults}/$transactionId';
      final response = await _dio.get(url);
      
      if (response.statusCode == 200) {
        return WebhookQueryResponse.fromJson(response.data);
      } else {
        return WebhookQueryResponse(
          success: false,
          error: 'HTTP ${response.statusCode}',
          message: response.statusMessage,
        );
      }
    } on DioException catch (e) {
      return WebhookQueryResponse(
        success: false,
        error: e.type.toString(),
        message: e.message ?? 'Network error occurred',
      );
    } catch (e) {
      return WebhookQueryResponse(
        success: false,
        error: 'EXCEPTION',
        message: e.toString(),
      );
    }
  }
  
  Future<List<WebhookResult>> getAllWebhookResults() async {
    try {
      final response = await _dio.get('${ApiConfig.webhookResults}/all');
      
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List<dynamic> dataList = response.data['data'] ?? [];
        return dataList
            .map((item) => WebhookResult.fromJson(item as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Failed to fetch all webhook results: $e');
      }
      return [];
    }
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// OUTPUT API RESULTS
  /// ═════════════════════════════════════════════════════════════════════════
  
  Future<OutputApiResult> getOutputApiResults({
    required String transactionId,
    String? workflowId,
  }) async {
    try {
      final response = await _dio.post(
        ApiConfig.outputApi,
        data: {
          'transactionId': transactionId,
          if (workflowId != null) 'workflowId': workflowId,
          'sendDebugInfo': true,
          'sendReviewDetails': true,
        },
      );
      
      if (response.statusCode == 200) {
        return OutputApiResult.fromJson(response.data as Map<String, dynamic>);
      } else {
        return OutputApiResult(
          success: false,
          error: 'HTTP ${response.statusCode}',
          message: response.statusMessage ?? 'Unknown error',
        );
      }
    } on DioException catch (e) {
      return OutputApiResult(
        success: false,
        error: e.type.toString(),
        message: e.message ?? 'Network error',
      );
    } catch (e) {
      return OutputApiResult(
        success: false,
        error: 'EXCEPTION',
        message: e.toString(),
      );
    }
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// LOGS API RESULTS
  /// ═════════════════════════════════════════════════════════════════════════
  
  Future<LogsApiResult> getLogsApiResults({
    required String transactionId,
    String? workflowId,
  }) async {
    try {
      final response = await _dio.post(
        ApiConfig.logsApi,
        data: {
          'transactionId': transactionId,
          if (workflowId != null) 'workflowId': workflowId,
        },
      );
      
      if (response.statusCode == 200) {
        return LogsApiResult.fromJson(response.data as Map<String, dynamic>);
      } else {
        return LogsApiResult(
          success: false,
          modules: [],
          error: 'HTTP ${response.statusCode}',
          message: response.statusMessage ?? 'Unknown error',
        );
      }
    } on DioException catch (e) {
      return LogsApiResult(
        success: false,
        modules: [],
        error: e.type.toString(),
        message: e.message ?? 'Network error',
      );
    } catch (e) {
      return LogsApiResult(
        success: false,
        modules: [],
        error: 'EXCEPTION',
        message: e.toString(),
      );
    }
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// FILE UPLOAD
  /// ═════════════════════════════════════════════════════════════════════════
  
  Future<Map<String, dynamic>> uploadFile({
    required File file,
    required String key,
    ProgressCallback? onProgress,
  }) async {
    try {
      final fileName = file.path.split('/').last;
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
        ),
        'key': key,
      });
      
      final response = await _dio.post(
        ApiConfig.fileUpload,
        data: formData,
        onSendProgress: onProgress,
      );
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': response.data,
        };
      } else {
        return {
          'success': false,
          'error': 'HTTP ${response.statusCode}',
          'message': response.statusMessage,
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.type.toString(),
        'message': e.message ?? 'Upload failed',
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'EXCEPTION',
        'message': e.toString(),
      };
    }
  }
  
  Future<Map<String, dynamic>> uploadMultipleFiles({
    required List<File> files,
    ProgressCallback? onProgress,
  }) async {
    try {
      final formData = FormData();
      
      for (var file in files) {
        final fileName = file.path.split('/').last;
        formData.files.add(
          MapEntry(
            'files',
            await MultipartFile.fromFile(
              file.path,
              filename: fileName,
            ),
          ),
        );
      }
      
      final response = await _dio.post(
        '${ApiConfig.fileUpload}/multiple',
        data: formData,
        onSendProgress: onProgress,
      );
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': response.data,
        };
      } else {
        return {
          'success': false,
          'error': 'HTTP ${response.statusCode}',
          'message': response.statusMessage,
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.type.toString(),
        'message': e.message ?? 'Upload failed',
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'EXCEPTION',
        'message': e.toString(),
      };
    }
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// UTILITY METHODS
  /// ═════════════════════════════════════════════════════════════════════════
  
  void updateBaseUrl(String newBaseUrl) {
    _dio.options.baseUrl = newBaseUrl;
    if (kDebugMode) {
      print('🔄 Base URL updated to: $newBaseUrl');
    }
  }
  
  void updateHeaders(Map<String, dynamic> headers) {
    _dio.options.headers.addAll(headers);
  }
}
