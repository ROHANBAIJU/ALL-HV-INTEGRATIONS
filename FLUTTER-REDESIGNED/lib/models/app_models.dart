/// ═══════════════════════════════════════════════════════════════════════════
/// APP MODE ENUM
/// ═══════════════════════════════════════════════════════════════════════════

enum AppMode {
  defaultMode,
  dynamicMode;
  
  String get value {
    switch (this) {
      case AppMode.defaultMode:
        return 'default';
      case AppMode.dynamicMode:
        return 'dynamic';
    }
  }
  
  String get displayName {
    switch (this) {
      case AppMode.defaultMode:
        return 'Default Mode';
      case AppMode.dynamicMode:
        return 'Dynamic Mode';
    }
  }
  
  String get description {
    switch (this) {
      case AppMode.defaultMode:
        return 'Use server-stored credentials (Recommended)';
      case AppMode.dynamicMode:
        return 'Provide custom credentials';
    }
  }
}

/// ═══════════════════════════════════════════════════════════════════════════
/// WORKFLOW INPUT MODEL
/// ═══════════════════════════════════════════════════════════════════════════

enum InputType {
  text,
  file;
  
  String get displayName {
    switch (this) {
      case InputType.text:
        return 'Text';
      case InputType.file:
        return 'File';
    }
  }
}

class WorkflowInput {
  final String key;
  final String value;
  final InputType type;
  final String? fileName;
  final String? fileUrl;
  
  WorkflowInput({
    required this.key,
    required this.value,
    this.type = InputType.text,
    this.fileName,
    this.fileUrl,
  });
  
  Map<String, dynamic> toJson() {
    return {
      'key': key,
      'value': value,
      'type': type.name,
      if (fileName != null) 'fileName': fileName,
      if (fileUrl != null) 'fileUrl': fileUrl,
    };
  }
  
  factory WorkflowInput.fromJson(Map<String, dynamic> json) {
    return WorkflowInput(
      key: json['key'] as String,
      value: json['value'] as String,
      type: InputType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => InputType.text,
      ),
      fileName: json['fileName'] as String?,
      fileUrl: json['fileUrl'] as String?,
    );
  }
}

/// ═══════════════════════════════════════════════════════════════════════════
/// APP STATE MODEL
/// ═══════════════════════════════════════════════════════════════════════════

enum AppState {
  initial,
  configuringMode,
  generatingTransaction,
  fetchingToken,
  launchingSDK,
  sdkInProgress,
  sdkCompleted,
  fetchingResults,
  completed,
  error;
  
  String get displayName {
    switch (this) {
      case AppState.initial:
        return 'Ready';
      case AppState.configuringMode:
        return 'Configuring';
      case AppState.generatingTransaction:
        return 'Generating ID';
      case AppState.fetchingToken:
        return 'Fetching Token';
      case AppState.launchingSDK:
        return 'Launching SDK';
      case AppState.sdkInProgress:
        return 'SDK Running';
      case AppState.sdkCompleted:
        return 'SDK Completed';
      case AppState.fetchingResults:
        return 'Fetching Results';
      case AppState.completed:
        return 'Completed';
      case AppState.error:
        return 'Error';
    }
  }
}
