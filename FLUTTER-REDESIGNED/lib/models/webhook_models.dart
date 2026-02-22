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
      status: json['status'],
      result: json['result'] as Map<String, dynamic>?,
      timestamp: json['timestamp'],
      receivedAt: json['receivedAt'],
      rawData: json['rawData'] as Map<String, dynamic>?,
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
