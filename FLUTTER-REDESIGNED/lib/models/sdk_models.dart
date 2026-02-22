import 'package:hyperkyc_flutter/hyperkyc_result.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// SDK RESPONSE MODEL (from HyperKYC SDK)
/// ═══════════════════════════════════════════════════════════════════════════

class SdkResponse {
  final String? status;
  final String? transactionId;
  final String? errorCode;
  final String? errorMessage;
  final Map<String, dynamic>? details;
  final DateTime timestamp;
  final HyperKycResult? rawResult;
  
  SdkResponse({
    this.status,
    this.transactionId,
    this.errorCode,
    this.errorMessage,
    this.details,
    DateTime? timestamp,
    this.rawResult,
  }) : timestamp = timestamp ?? DateTime.now();
  
  factory SdkResponse.fromHyperKycResult(HyperKycResult result) {
    return SdkResponse(
      status: result.status?.value,
      transactionId: result.transactionId,
      errorCode: result.errorCode?.toString(),
      errorMessage: result.errorMessage,
      details: result.details != null ? Map<String, dynamic>.from(result.details!) : null,
      timestamp: DateTime.now(),
      rawResult: result,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'status': status,
      'transactionId': transactionId,
      'errorCode': errorCode,
      'errorMessage': errorMessage,
      'details': details,
      'timestamp': timestamp.toIso8601String(),
    };
  }
  
  bool get isSuccess => 
      status == 'auto_approved' || 
      status == 'auto_declined' || 
      status == 'needs_review';
  
  bool get isError => status == 'error';
  
  bool get isCancelled => status == 'user_cancelled';
}
