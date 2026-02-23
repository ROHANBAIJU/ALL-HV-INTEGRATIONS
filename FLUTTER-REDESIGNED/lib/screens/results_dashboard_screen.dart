import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../providers/kyc_provider.dart';
import '../models/webhook_models.dart';
import '../widgets/app_logo.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// RESULTS DASHBOARD SCREEN - 3 Tabs: SDK Response, Outputs API, Webhooks
/// ═══════════════════════════════════════════════════════════════════════════

class ResultsDashboardScreen extends StatefulWidget {
  const ResultsDashboardScreen({super.key});

  @override
  State<ResultsDashboardScreen> createState() => _ResultsDashboardScreenState();
}

class _ResultsDashboardScreenState extends State<ResultsDashboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _hasCalledOutputsApi = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    
    // Auto-call Outputs API after SDK completes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _autoCallOutputsApi();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _autoCallOutputsApi() async {
    if (!_hasCalledOutputsApi) {
      _hasCalledOutputsApi = true;
      final provider = context.read<KycProvider>();
      await Future.delayed(const Duration(milliseconds: 500));
      // Output API: call immediately after SDK completes
      // Webhook: poll to check if HV has sent an event yet
      await Future.wait([
        provider.fetchOutputApiResults(),
        provider.fetchWebhookResults(),
      ]);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const Padding(
          padding: EdgeInsets.all(8.0),
          child: AppLogoIcon(height: 32),
        ),
        title: const Text('Results Dashboard'),
        backgroundColor: AppTheme.primaryPurple,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          tabs: const [
            Tab(
              icon: Icon(Icons.phone_android_rounded),
              text: 'SDK Response',
            ),
            Tab(
              icon: Icon(Icons.api_rounded),
              text: 'Output API',
            ),
            Tab(
              icon: Icon(Icons.list_alt_rounded),
              text: 'Logs API',
            ),
          ],
        ),
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppTheme.primaryPurple.withOpacity(0.1),
              Colors.white,
            ],
          ),
        ),
        child: TabBarView(
          controller: _tabController,
          children: [
            _buildSdkResponseTab(),
            _buildOutputApiTab(),
            _buildLogsApiTab(),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _handleStartNewFlow,
        backgroundColor: AppTheme.accentOrange,
        icon: const Icon(Icons.refresh_rounded),
        label: const Text('Start Another Flow'),
      ),
    );
  }

  /// ═════════════════════════════════════════════════════════════════════════
  /// SDK RESPONSE TAB
  /// ═════════════════════════════════════════════════════════════════════════

  Widget _buildSdkResponseTab() {
    return Consumer<KycProvider>(
      builder: (context, provider, _) {
        final sdkResponse = provider.sdkResponse;

        if (sdkResponse == null) {
          return _buildEmptyState(
            icon: Icons.phone_android_rounded,
            title: 'No SDK Response',
            message: 'SDK response will appear here',
          );
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildStatusCard(sdkResponse),
              const SizedBox(height: 16),
              _buildInfoCard(
                title: 'Transaction Details',
                icon: Icons.info_outline_rounded,
                children: [
                  _buildInfoRow('Transaction ID', sdkResponse.transactionId ?? 'N/A'),
                  _buildInfoRow('Status', sdkResponse.status ?? 'Unknown'),
                  _buildInfoRow('Timestamp', _formatDateTime(sdkResponse.timestamp)),
                ],
              ),
              if (sdkResponse.errorCode != null || sdkResponse.errorMessage != null) ...[
                const SizedBox(height: 16),
                _buildInfoCard(
                  title: 'Error Details',
                  icon: Icons.error_outline_rounded,
                  color: AppTheme.errorRed,
                  children: [
                    if (sdkResponse.errorCode != null)
                      _buildInfoRow('Error Code', sdkResponse.errorCode!),
                    if (sdkResponse.errorMessage != null)
                      _buildInfoRow('Error Message', sdkResponse.errorMessage!),
                  ],
                ),
              ],
              if (sdkResponse.details != null && sdkResponse.details!.isNotEmpty) ...[
                const SizedBox(height: 16),
                _buildJsonCard('Additional Details', sdkResponse.details!),
              ],
              const SizedBox(height: 16),
              _buildJsonCard('Raw SDK Output', sdkResponse.toJson()),
            ],
          ),
        );
      },
    );
  }

  /// ═════════════════════════════════════════════════════════════════════════
  /// OUTPUT API TAB
  /// ═════════════════════════════════════════════════════════════════════════

  Widget _buildOutputApiTab() {
    return Consumer<KycProvider>(
      builder: (context, provider, _) {
        if (provider.loading && provider.outputApiResult == null) {
          return _buildLoadingState('Calling Output API...');
        }

        final result = provider.outputApiResult;

        if (result == null) {
          return _buildEmptyState(
            icon: Icons.api_rounded,
            title: 'No Output Data',
            message: 'Output API result will appear here',
            action: ElevatedButton.icon(
              onPressed: () => provider.fetchOutputApiResults(),
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Call Output API'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryPurple,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          );
        }

        if (!result.success) {
          return _buildEmptyState(
            icon: Icons.error_outline_rounded,
            title: 'Output API Failed',
            message: result.message ?? result.error ?? 'Unknown error',
            action: ElevatedButton.icon(
              onPressed: () => provider.fetchOutputApiResults(),
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.errorRed,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          );
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Status badge
              _buildOutputStatusCard(result.status),
              const SizedBox(height: 16),
              // Core info
              _buildInfoCard(
                title: 'Transaction',
                icon: Icons.receipt_long_rounded,
                children: [
                  _buildInfoRow('Transaction ID', result.transactionId ?? 'N/A'),
                  _buildInfoRow('Workflow ID', result.workflowId ?? 'N/A'),
                  _buildInfoRow('Status', result.status ?? 'Unknown'),
                ],
              ),
              // User details
              if (result.userDetails != null && result.userDetails!.isNotEmpty) ...[
                const SizedBox(height: 16),
                _buildJsonCard('User Details', result.userDetails!),
              ],
              // Debug info
              if (result.debugInfo != null && result.debugInfo!.isNotEmpty) ...[
                const SizedBox(height: 16),
                _buildJsonCard('Debug Info', result.debugInfo!),
              ],
              // Review details
              if (result.reviewDetails != null && result.reviewDetails!.isNotEmpty) ...[
                const SizedBox(height: 16),
                _buildJsonCard('Review Details', result.reviewDetails!),
              ],
              // Full raw JSON
              if (result.rawResult != null) ...[
                const SizedBox(height: 16),
                _buildJsonCard('Full Output API Response', result.rawResult!),
              ],
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () => provider.fetchOutputApiResults(),
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Refresh'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.primaryPurple,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Widget _buildOutputStatusCard(String? status) {
    Color color;
    IconData icon;
    String label;

    switch (status?.toLowerCase()) {
      case 'auto_approved':
      case 'manually_approved':
        color = AppTheme.successGreen;
        icon = Icons.check_circle_rounded;
        label = status!;
        break;
      case 'auto_declined':
      case 'manually_declined':
        color = AppTheme.errorRed;
        icon = Icons.cancel_rounded;
        label = status!;
        break;
      case 'needs_review':
        color = AppTheme.warningAmber;
        icon = Icons.pending_rounded;
        label = 'Needs Review';
        break;
      case 'user_cancelled':
        color = Colors.grey;
        icon = Icons.do_disturb_rounded;
        label = 'User Cancelled';
        break;
      case 'error':
        color = AppTheme.errorRed;
        icon = Icons.error_rounded;
        label = 'Error';
        break;
      default:
        color = AppTheme.primaryPurple;
        icon = Icons.info_rounded;
        label = status ?? 'Unknown';
    }

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color.withOpacity(0.12), Colors.white],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              child: Icon(icon, color: Colors.white, size: 28),
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Application Status',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  label,
                  style: TextStyle(
                    color: color,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// ═════════════════════════════════════════════════════════════════════════
  /// LOGS API TAB  (Webhook listener + conditional Logs API call)
  /// ═════════════════════════════════════════════════════════════════════════

  Widget _buildLogsApiTab() {
    return Consumer<KycProvider>(
      builder: (context, provider, _) {
        final webhook = provider.webhookResult;
        final logsResult = provider.logsApiResult;
        final webhookReceived = webhook != null;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── SECTION 1: Webhook Listener ──────────────────────────────
              Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header row
                      Row(
                        children: [
                          Icon(Icons.sensors_rounded,
                              color: webhookReceived ? AppTheme.successGreen : Colors.orange),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Webhook Listener',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                          ),
                          // Refresh button
                          if (provider.loading)
                            const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          else
                            IconButton(
                              icon: const Icon(Icons.refresh_rounded),
                              tooltip: 'Refresh',
                              color: AppTheme.primaryPurple,
                              onPressed: () => provider.fetchWebhookResults(),
                            ),
                          // Clear button
                          IconButton(
                            icon: const Icon(Icons.clear_all_rounded),
                            tooltip: 'Clear',
                            color: Colors.grey,
                            onPressed: webhookReceived
                                ? () => provider.clearWebhookData()
                                : null,
                          ),
                        ],
                      ),
                      const Divider(height: 24),
                      // Status indicator
                      if (!webhookReceived)
                        _buildWebhookWaitingTile()
                      else
                        _buildWebhookReceivedTile(webhook),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // ── SECTION 2: Call Logs API button ──────────────────────────
              AnimatedOpacity(
                opacity: webhookReceived ? 1.0 : 0.45,
                duration: const Duration(milliseconds: 300),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Explanatory note when disabled
                    if (!webhookReceived)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          children: [
                            Icon(Icons.lock_clock_rounded,
                                size: 16, color: Colors.grey.shade500),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Logs API unlocks once the webhook event is received',
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey.shade500),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ElevatedButton.icon(
                      onPressed: (webhookReceived && !provider.loading)
                          ? () => provider.fetchLogsApiResults()
                          : null,
                      icon: provider.loading && logsResult == null
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(Icons.list_alt_rounded),
                      label: Text(
                        provider.loading && logsResult == null
                            ? 'Fetching Logs...'
                            : logsResult != null
                                ? 'Refresh Logs API'
                                : 'Call Logs API',
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryPurple,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: Colors.grey.shade300,
                        disabledForegroundColor: Colors.grey.shade500,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        elevation: webhookReceived ? 4 : 0,
                      ),
                    ),
                  ],
                ),
              ),

              // ── SECTION 3: Logs results (shown after button is pressed) ──
              if (logsResult != null) ...[  
                const SizedBox(height: 24),
                if (!logsResult.success)
                  Card(
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline_rounded,
                              color: Colors.red),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              logsResult.message ??
                                  logsResult.error ??
                                  'Logs API returned an error',
                              style: const TextStyle(color: Colors.red),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else ...[  
                  _buildInfoCard(
                    title: 'Application Summary',
                    icon: Icons.summarize_rounded,
                    children: [
                      _buildInfoRow(
                          'Transaction ID', logsResult.transactionId ?? 'N/A'),
                      _buildInfoRow(
                          'App Status', logsResult.appStatus ?? 'Unknown'),
                      _buildInfoRow(
                          'Modules Run', '${logsResult.modules.length}'),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (logsResult.modules.isEmpty)
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Text(
                          'No module data returned',
                          style: TextStyle(color: Colors.grey.shade600),
                        ),
                      ),
                    )
                  else
                    ...logsResult.modules.asMap().entries.map((entry) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _buildModuleCard(
                            entry.key + 1, entry.value),
                      );
                    }),
                  if (logsResult.rawResult != null) ...[  
                    const SizedBox(height: 4),
                    _buildJsonCard(
                        'Full Logs API Response', logsResult.rawResult!),
                  ],
                ],
              ],

              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Widget _buildWebhookWaitingTile() {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: Colors.orange.shade400,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.orange.shade200,
                blurRadius: 6,
                spreadRadius: 2,
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Waiting for webhook event...',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Text(
                'HyperVerge will push an event when the workflow finishes. Tap refresh to check.',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildWebhookReceivedTile(WebhookResult webhook) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: const BoxDecoration(
                color: AppTheme.successGreen,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'Event received',
              style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.successGreen,
                  fontSize: 15),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _buildInfoRow('Transaction ID', webhook.transactionId),
        if (webhook.status != null)
          _buildInfoRow('Status', webhook.status!),
        if (webhook.timestamp != null)
          _buildInfoRow('Event Time', _formatUtcString(webhook.timestamp!)),
        if (webhook.receivedAt != null)
          _buildInfoRow('Received At', _formatUtcString(webhook.receivedAt!)),
        // Show raw webhook payload
        if (webhook.rawData != null && webhook.rawData!.isNotEmpty) ...[  
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Raw Webhook Payload',
                      style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade700),
                    ),
                    GestureDetector(
                      onTap: () {
                        Clipboard.setData(ClipboardData(
                          text: const JsonEncoder.withIndent('  ')
                              .convert(webhook.rawData),
                        ));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                              content: Text('Payload copied'),
                              duration: Duration(seconds: 1)),
                        );
                      },
                      child: Icon(Icons.copy_rounded,
                          size: 16, color: Colors.grey.shade600),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                SelectableText(
                  const JsonEncoder.withIndent('  ').convert(webhook.rawData),
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildModuleCard(int index, LogsApiModule module) {
    final statusColor = _moduleStatusColor(module.status);
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ExpansionTile(
        leading: CircleAvatar(
          backgroundColor: AppTheme.primaryPurple.withOpacity(0.15),
          child: Text(
            '$index',
            style: TextStyle(
              color: AppTheme.primaryPurple,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          module.moduleName,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
        subtitle: Row(
          children: [
            if (module.status != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: statusColor.withOpacity(0.4)),
                ),
                child: Text(
                  module.status!,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: 8),
            ],
            if (module.attempts != null)
              Text(
                '${module.attempts} attempt${module.attempts! > 1 ? 's' : ''}',
                style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
              ),
          ],
        ),
        children: [
          if (module.details != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: SelectableText(
                  const JsonEncoder.withIndent('  ').convert(module.details),
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 11),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Color _moduleStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'pass':
      case 'approved':
        return AppTheme.successGreen;
      case 'fail':
      case 'rejected':
      case 'declined':
        return AppTheme.errorRed;
      case 'skipped':
      case 'not_attempted':
        return Colors.grey;
      default:
        return AppTheme.primaryPurple;
    }
  }

  /// ═════════════════════════════════════════════════════════════════════════
  /// REUSABLE COMPONENTS
  /// ═════════════════════════════════════════════════════════════════════════

  Widget _buildStatusCard(sdkResponse) {
    final isSuccess = sdkResponse.isSuccess;
    final isError = sdkResponse.isError;
    final isCancelled = sdkResponse.isCancelled;

    Color color;
    IconData icon;
    String title;

    if (isSuccess) {
      color = AppTheme.successGreen;
      icon = Icons.check_circle_rounded;
      title = 'Success';
    } else if (isError) {
      color = AppTheme.errorRed;
      icon = Icons.error_rounded;
      title = 'Error';
    } else if (isCancelled) {
      color = AppTheme.warningAmber;
      icon = Icons.cancel_rounded;
      title = 'Cancelled';
    } else {
      color = Colors.grey;
      icon = Icons.info_rounded;
      title = 'Unknown';
    }

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(24.0),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color.withOpacity(0.1), Colors.white],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: Colors.white, size: 32),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: color,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    sdkResponse.status ?? 'No status',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey.shade700,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
    Color? color,
  }) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color ?? AppTheme.primaryPurple),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
              ),
            ),
          ),
          Expanded(
            child: SelectableText(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJsonCard(String title, Map<String, dynamic> data) {
    final jsonString = const JsonEncoder.withIndent('  ').convert(data);

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.code_rounded, color: AppTheme.accentOrange),
                    const SizedBox(width: 12),
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.copy_rounded),
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: jsonString));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Copied to clipboard')),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: SelectableText(
                jsonString,
                style: const TextStyle(
                  fontFamily: 'monospace',
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }


  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String message,
    Widget? action,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 80, color: Colors.grey.shade300),
            const SizedBox(height: 24),
            Text(
              title,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey.shade600,
                  ),
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade500),
            ),
            if (action != null) ...[
              const SizedBox(height: 24),
              action,
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(color: Colors.grey.shade600),
          ),
        ],
      ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    final local = dateTime.toLocal();
    final date = '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')}';
    final time = '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}:${local.second.toString().padLeft(2, '0')}';
    return '$date $time';
  }

  /// Parse an ISO-8601 UTC string and display in device local time
  String _formatUtcString(String utcString) {
    try {
      final dt = DateTime.parse(utcString).toLocal();
      final date = '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
      final time = '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}:${dt.second.toString().padLeft(2, '0')}';
      // Show offset so it's clear it's local
      final offset = dt.timeZoneOffset;
      final sign = offset.isNegative ? '-' : '+';
      final hh = offset.inHours.abs().toString().padLeft(2, '0');
      final mm = (offset.inMinutes.abs() % 60).toString().padLeft(2, '0');
      return '$date $time $sign$hh:$mm';
    } catch (_) {
      return utcString; // fallback: show raw if unparseable
    }
  }

  /// ═════════════════════════════════════════════════════════════════════════
  /// HANDLERS
  /// ═════════════════════════════════════════════════════════════════════════

  void _handleStartNewFlow() {
    final provider = context.read<KycProvider>();
    provider.startNewFlow();
    Navigator.pop(context);
  }
}
