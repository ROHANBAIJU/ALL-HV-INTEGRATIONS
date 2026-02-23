/// ═══════════════════════════════════════════════════════════════════════════
/// WEBHOOK RESULT MODEL
/// ═══════════════════════════════════════════════════════════════════════════

class WebhookResult {
  final String transactionId;
  final String? workflowId;
  final String? status;
  final Map<String, dynamic>? result;
  final String? timestamp;
  final String? receivedAt;
  final Map<String, dynamic>? rawData;
  
  WebhookResult({
    required this.transactionId,
    this.workflowId,
    this.status,
    this.result,
    this.timestamp,
    this.receivedAt,
    this.rawData,
  });
  
  factory WebhookResult.fromJson(Map<String, dynamic> json) {
    return WebhookResult(
      transactionId: json['transactionId'] ?? '',
      workflowId: json['workflowId'],
      // Support both old format (status) and new format (applicationStatus)
      status: json['applicationStatus'] ?? json['status'],
      result: json['result'] as Map<String, dynamic>?,
      // Support both old format (timestamp) and new format (eventTime)
      timestamp: json['eventTime'] ?? json['timestamp'],
      receivedAt: json['receivedAt'],
      // Support both old format (rawData) and new format (webhookRaw)
      rawData: (json['webhookRaw'] ?? json['rawData']) as Map<String, dynamic>?,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'transactionId': transactionId,
      if (workflowId != null) 'workflowId': workflowId,
      if (status != null) 'status': status,
      if (result != null) 'result': result,
      if (timestamp != null) 'timestamp': timestamp,
      if (receivedAt != null) 'receivedAt': receivedAt,
      if (rawData != null) 'rawData': rawData,
    };
  }
}

/// ═══════════════════════════════════════════════════════════════════════════
/// WEBHOOK QUERY RESPONSE MODEL
/// ═══════════════════════════════════════════════════════════════════════════

class WebhookQueryResponse {
  final bool success;
  final WebhookResult? data;
  final String? error;
  final String? message;
  
  WebhookQueryResponse({
    required this.success,
    this.data,
    this.error,
    this.message,
  });
  
  factory WebhookQueryResponse.fromJson(Map<String, dynamic> json) {
    return WebhookQueryResponse(
      success: json['success'] ?? false,
      data: json['data'] != null 
          ? WebhookResult.fromJson(json['data'] as Map<String, dynamic>)
          : null,
      error: json['error'],
      message: json['message'],
    );
  }
}

/// ═══════════════════════════════════════════════════════════════════════════
/// OUTPUT API RESULT MODEL
/// ═══════════════════════════════════════════════════════════════════════════

class OutputApiResult {
  final bool success;
  final String? status;
  final String? transactionId;
  final String? workflowId;
  final Map<String, dynamic>? userDetails;
  final Map<String, dynamic>? debugInfo;
  final Map<String, dynamic>? reviewDetails;
  final Map<String, dynamic>? rawResult;
  final String? error;
  final String? message;

  OutputApiResult({
    required this.success,
    this.status,
    this.transactionId,
    this.workflowId,
    this.userDetails,
    this.debugInfo,
    this.reviewDetails,
    this.rawResult,
    this.error,
    this.message,
  });

  factory OutputApiResult.fromJson(Map<String, dynamic> json) {
    final result = json['result'] as Map<String, dynamic>?;
    return OutputApiResult(
      success: (json['statusCode'] == 200 || json['status'] == 'success') && result != null,
      status: result?['status'] as String?,
      transactionId: result?['transactionId'] as String?,
      workflowId: result?['workflowId'] as String?,
      userDetails: result?['userDetails'] as Map<String, dynamic>?,
      debugInfo: result?['debugInfo'] as Map<String, dynamic>?,
      reviewDetails: result?['reviewDetails'] as Map<String, dynamic>?,
      rawResult: result,
      error: json['error'] as String?,
      message: json['message'] as String?,
    );
  }
}

/// ═══════════════════════════════════════════════════════════════════════════
/// LOGS API MODULE MODEL
/// ═══════════════════════════════════════════════════════════════════════════

class LogsApiModule {
  final String moduleName;
  final String? moduleId;
  final String? status;
  final int? attempts;
  final Map<String, dynamic>? details;

  LogsApiModule({
    required this.moduleName,
    this.moduleId,
    this.status,
    this.attempts,
    this.details,
  });

  factory LogsApiModule.fromJson(Map<String, dynamic> json) {
    return LogsApiModule(
      moduleName: json['moduleName'] ?? json['type'] ?? 'Unknown Module',
      moduleId: json['moduleId'] as String?,
      status: json['status'] as String?,
      attempts: json['attempts'] as int?,
      details: json,
    );
  }
}

/// ═══════════════════════════════════════════════════════════════════════════
/// LOGS API RESULT MODEL
/// ═══════════════════════════════════════════════════════════════════════════

class LogsApiResult {
  final bool success;
  final String? appStatus;
  final String? transactionId;
  final List<LogsApiModule> modules;
  final Map<String, dynamic>? rawResult;
  final String? error;
  final String? message;

  LogsApiResult({
    required this.success,
    this.appStatus,
    this.transactionId,
    required this.modules,
    this.rawResult,
    this.error,
    this.message,
  });

  factory LogsApiResult.fromJson(Map<String, dynamic> json) {
    final result = json['result'] as Map<String, dynamic>?;
    List<LogsApiModule> modules = [];

    if (result != null) {
      // HV Logs API returns module results inside 'results' array
      final modulesList = result['results'] as List<dynamic>?;
      if (modulesList != null) {
        modules = modulesList
            .map((m) => LogsApiModule.fromJson(m as Map<String, dynamic>))
            .toList();
      }
    }

    return LogsApiResult(
      success: (json['statusCode'] == 200 || json['status'] == 'success') && result != null,
      // HV uses 'applicationStatus' at the result level
      appStatus: result?['applicationStatus'] as String?,
      transactionId: result?['transactionId'] as String?,
      modules: modules,
      rawResult: result,
      error: json['error'] as String?,
      message: json['message'] as String?,
    );
  }
}
