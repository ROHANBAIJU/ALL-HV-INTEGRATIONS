/// ═══════════════════════════════════════════════════════════════════════════
/// TOKEN REQUEST MODEL
/// ═════════════════════════════════════════════════════════════════════════

class TokenRequest {
  final String mode; // 'default' or 'dynamic'
  final String transactionId;
  final String? appId;
  final String? appKey;
  final String? workflowId;
  final Map<String, dynamic>? inputs;
  
  TokenRequest({
    required this.mode,
    required this.transactionId,
    this.appId,
    this.appKey,
    this.workflowId,
    this.inputs,
  });
  
  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'mode': mode,
      'transactionId': transactionId,
    };
    
    if (appId != null) data['appId'] = appId;
    if (appKey != null) data['appKey'] = appKey;
    if (workflowId != null) data['workflowId'] = workflowId;
    if (inputs != null && inputs!.isNotEmpty) data['inputs'] = inputs;
    
    return data;
  }
}

/// ═══════════════════════════════════════════════════════════════════════════
/// TOKEN RESPONSE MODEL
/// ═══════════════════════════════════════════════════════════════════════════

class TokenResponse {
  final bool success;
  final String? accessToken;
  final String? workflowId;
  final String? transactionId;
  final String? mode;
  final int? expiresIn;
  final String? timestamp;
  final String? error;
  final String? message;
  final String? code;
  final Map<String, dynamic>? inputs;
  
  TokenResponse({
    required this.success,
    this.accessToken,
    this.workflowId,
    this.transactionId,
    this.mode,
    this.expiresIn,
    this.timestamp,
    this.error,
    this.message,
    this.code,
    this.inputs,
  });
  
  factory TokenResponse.fromJson(Map<String, dynamic> json) {
    return TokenResponse(
      success: json['success'] ?? false,
      accessToken: json['accessToken'],
      workflowId: json['workflowId'],
      transactionId: json['transactionId'],
      mode: json['mode'],
      expiresIn: json['expiresIn'],
      timestamp: json['timestamp'],
      error: json['error'],
      message: json['message'],
      code: json['code'],
      inputs: json['inputs'] != null 
          ? Map<String, dynamic>.from(json['inputs']) 
          : null,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'success': success,
      if (accessToken != null) 'accessToken': accessToken,
      if (workflowId != null) 'workflowId': workflowId,
      if (transactionId != null) 'transactionId': transactionId,
      if (mode != null) 'mode': mode,
      if (expiresIn != null) 'expiresIn': expiresIn,
      if (timestamp != null) 'timestamp': timestamp,
      if (error != null) 'error': error,
      if (message != null) 'message': message,
      if (code != null) 'code': code,
      if (inputs != null) 'inputs': inputs,
    };
  }
}
