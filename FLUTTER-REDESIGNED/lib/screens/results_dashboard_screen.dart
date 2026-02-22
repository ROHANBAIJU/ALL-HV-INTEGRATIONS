import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../providers/kyc_provider.dart';
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
      await provider.fetchWebhookResults();
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
              text: 'Outputs API',
            ),
            Tab(
              icon: Icon(Icons.webhook_rounded),
              text: 'Webhooks',
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
            _buildOutputsApiTab(),
            _buildWebhooksTab(),
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
  /// OUTPUTS API TAB
  /// ═════════════════════════════════════════════════════════════════════════

  Widget _buildOutputsApiTab() {
    return Consumer<KycProvider>(
      builder: (context, provider, _) {
        if (provider.loading) {
          return _buildLoadingState('Fetching webhook results...');
        }

        final webhookResult = provider.webhookResult;

        if (webhookResult == null) {
          return _buildEmptyState(
            icon: Icons.api_rounded,
            title: 'No Results Yet',
            message: 'Webhook results will appear here once available',
            action: ElevatedButton.icon(
              onPressed: () => provider.fetchWebhookResults(),
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry Fetch'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryPurple,
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
              _buildInfoCard(
                title: 'Webhook Information',
                icon: Icons.webhook_rounded,
                children: [
                  _buildInfoRow('Transaction ID', webhookResult.transactionId),
                  if (webhookResult.workflowId != null)
                    _buildInfoRow('Workflow ID', webhookResult.workflowId!),
                  if (webhookResult.status != null)
                    _buildInfoRow('Status', webhookResult.status!),
                  if (webhookResult.timestamp != null)
                    _buildInfoRow('Timestamp', webhookResult.timestamp!),
                  if (webhookResult.receivedAt != null)
                    _buildInfoRow('Received At', webhookResult.receivedAt!),
                ],
              ),
              if (webhookResult.result != null && webhookResult.result!.isNotEmpty) ...[
                const SizedBox(height: 16),
                _buildJsonCard('Result Data', webhookResult.result!),
              ],
              if (webhookResult.rawData != null && webhookResult.rawData!.isNotEmpty) ...[
                const SizedBox(height: 16),
                _buildJsonCard('Raw Webhook Data', webhookResult.rawData!),
              ],
            ],
          ),
        );
      },
    );
  }

  /// ═════════════════════════════════════════════════════════════════════════
  /// WEBHOOKS TAB
  /// ═════════════════════════════════════════════════════════════════════════

  Widget _buildWebhooksTab() {
    return Consumer<KycProvider>(
      builder: (context, provider, _) {
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildInfoCard(
                title: 'Webhook Listener',
                icon: Icons.sensors_rounded,
                color: AppTheme.successGreen,
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
                      const Text(
                        'Listening for finish_transaction event...',
                        style: TextStyle(fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Card(
                elevation: 4,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.info_outline_rounded,
                            color: AppTheme.primaryPurple,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'How it works',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _buildStepItem(
                        step: '1',
                        text: 'SDK sends finish_transaction event to backend',
                      ),
                      const SizedBox(height: 8),
                      _buildStepItem(
                        step: '2',
                        text: 'Backend webhook endpoint receives the event',
                      ),
                      const SizedBox(height: 8),
                      _buildStepItem(
                        step: '3',
                        text: 'Event is stored in server memory',
                      ),
                      const SizedBox(height: 8),
                      _buildStepItem(
                        step: '4',
                        text: 'Click button below to fetch stored results',
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: provider.loading
                    ? null
                    : () => provider.fetchWebhookResults(),
                icon: provider.loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.cloud_download_rounded),
                label: Text(
                  provider.loading ? 'Calling API...' : 'Call Results API',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryPurple,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 4,
                ),
              ),
              if (provider.webhookResult != null) ...[
                const SizedBox(height: 24),
                _buildInfoCard(
                  title: 'Latest Result',
                  icon: Icons.check_circle_outline_rounded,
                  color: AppTheme.successGreen,
                  children: [
                    _buildInfoRow(
                      'Transaction ID',
                      provider.webhookResult!.transactionId,
                    ),
                    if (provider.webhookResult!.status != null)
                      _buildInfoRow('Status', provider.webhookResult!.status!),
                    if (provider.webhookResult!.timestamp != null)
                      _buildInfoRow('Timestamp', provider.webhookResult!.timestamp!),
                  ],
                ),
              ],
            ],
          ),
        );
      },
    );
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

  Widget _buildStepItem({required String step, required String text}) {
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: AppTheme.primaryPurple,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              step,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              color: Colors.grey.shade700,
              fontSize: 14,
            ),
          ),
        ),
      ],
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
    return '${dateTime.year}-${dateTime.month.toString().padLeft(2, '0')}-${dateTime.day.toString().padLeft(2, '0')} '
        '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
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
