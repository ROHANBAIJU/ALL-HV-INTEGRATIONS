import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
import '../config/app_theme.dart';
import '../models/app_models.dart';
import '../providers/kyc_provider.dart';
import '../widgets/app_logo.dart';
import 'results_dashboard_screen.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// HOME SCREEN - Mode Selection & Configuration
/// ═══════════════════════════════════════════════════════════════════════════

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _appIdController = TextEditingController();
  final _appKeyController = TextEditingController();
  final _workflowIdController = TextEditingController();
  final _manualNameController = TextEditingController();
  
  // Dynamic mode inputs
  final List<Map<String, dynamic>> _dynamicInputs = [];
  
  // Environment switching state
  bool _switchingEnvironment = false;
  
  @override
  void dispose() {
    _appIdController.dispose();
    _appKeyController.dispose();
    _workflowIdController.dispose();
    _manualNameController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: AppTheme.primaryGradient,
        ),
        child: SafeArea(
          child: Consumer<KycProvider>(
            builder: (context, provider, _) {
              return SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildHeader(),
                    const SizedBox(height: 40),
                    _buildModeSelector(provider),
                    const SizedBox(height: 32),
                    _buildCredentialsCard(provider),
                    const SizedBox(height: 32),
                    _buildInputsCard(provider),
                    const SizedBox(height: 32),
                    _buildTransactionCard(provider),
                    const SizedBox(height: 32),
                    _buildActionButtons(provider),
                    if (provider.error != null) ...[
                      const SizedBox(height: 24),
                      _buildErrorCard(provider),
                    ],
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// HEADER
  /// ═════════════════════════════════════════════════════════════════════════
  
  Widget _buildHeader() {
    return Consumer<KycProvider>(
      builder: (context, provider, _) {
        return Column(
          children: [
            const SizedBox(height: 20),
            const AppLogo(
              size: 48.0,
              showSubtitle: true,
            ),
            const SizedBox(height: 16),
            
            // Environment Toggle Card - Beautiful & Smooth
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: provider.isProduction
                      ? [Colors.green.shade400, Colors.green.shade600]
                      : [Colors.orange.shade400, Colors.deepOrange.shade500],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(30),
                boxShadow: [
                  BoxShadow(
                    color: (provider.isProduction ? Colors.green : Colors.orange).withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.95),
                  borderRadius: BorderRadius.circular(26),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Environment Icon
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      transitionBuilder: (child, animation) {
                        return ScaleTransition(
                          scale: animation,
                          child: child,
                        );
                      },
                      child: Container(
                        key: ValueKey(provider.isProduction),
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: provider.isProduction
                                ? [Colors.green.shade300, Colors.green.shade500]
                                : [Colors.orange.shade300, Colors.orange.shade500],
                          ),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          provider.isProduction 
                              ? Icons.cloud_done_rounded 
                              : Icons.computer_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                    
                    const SizedBox(width: 12),
                    
                    // Environment Text
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Backend Environment',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 2),
                        AnimatedDefaultTextStyle(
                          duration: const Duration(milliseconds: 300),
                          style: TextStyle(
                            color: provider.isProduction ? Colors.green.shade700 : Colors.orange.shade700,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.3,
                          ),
                          child: Text(provider.environment),
                        ),
                      ],
                    ),
                    
                    const SizedBox(width: 16),
                    
                    // Loading or Toggle Switch
                    if (_switchingEnvironment)
                      SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation(
                            provider.isProduction ? Colors.green : Colors.orange,
                          ),
                        ),
                      )
                    else
                      GestureDetector(
                        onTap: () => _handleEnvironmentSwitch(provider, !provider.isProduction),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          width: 48,
                          height: 26,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: provider.isProduction
                                  ? [Colors.green.shade400, Colors.green.shade600]
                                  : [Colors.grey.shade300, Colors.grey.shade400],
                              begin: Alignment.centerLeft,
                              end: Alignment.centerRight,
                            ),
                            borderRadius: BorderRadius.circular(13),
                          ),
                          child: AnimatedAlign(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                            alignment: provider.isProduction 
                                ? Alignment.centerRight 
                                : Alignment.centerLeft,
                            child: Container(
                              width: 22,
                              height: 22,
                              margin: const EdgeInsets.symmetric(horizontal: 2),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.2),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Icon(
                                provider.isProduction ? Icons.check : Icons.close,
                                size: 14,
                                color: provider.isProduction ? Colors.green : Colors.grey.shade600,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 8),
            Text(
              'Secure KYC Verification',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.white.withOpacity(0.8),
                  ),
            ),
          ],
        );
      },
    );
  }
  
  /// Handle environment switch with health check (optimized)
  Future<void> _handleEnvironmentSwitch(KycProvider provider, bool toProduction) async {
    if (_switchingEnvironment) return; // Prevent double-tap
    
    setState(() => _switchingEnvironment = true);
    
    // Run health check in background
    final result = await provider.switchEnvironment(toProduction);
    
    setState(() => _switchingEnvironment = false);
    
    if (!mounted) return;
    
    if (result['success'] == true) {
      // Show success snackbar - Modern & Clean
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '${result['environment']} environment active',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          backgroundColor: Colors.green.shade600,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 2),
          margin: const EdgeInsets.all(16),
        ),
      );
    } else {
      // Show error snackbar - Quick & Clean (no dialog for better UX)
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.warning_rounded, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Environment unavailable',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      toProduction 
                          ? 'Check Vercel deployment'
                          : 'Start local backend',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          backgroundColor: Colors.orange.shade700,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 3),
          margin: const EdgeInsets.all(16),
        ),
      );
    }
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// MODE SELECTOR
  /// ═════════════════════════════════════════════════════════════════════════
  
  Widget _buildModeSelector(KycProvider provider) {
    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Select Mode',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            _buildModeOption(
              provider: provider,
              mode: AppMode.defaultMode,
              icon: Icons.settings_suggest_rounded,
            ),
            const SizedBox(height: 12),
            _buildModeOption(
              provider: provider,
              mode: AppMode.dynamicMode,
              icon: Icons.tune_rounded,
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildModeOption({
    required KycProvider provider,
    required AppMode mode,
    required IconData icon,
  }) {
    final isSelected = provider.mode == mode;
    
    return InkWell(
      onTap: () => provider.setMode(mode),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryPurple.withOpacity(0.1)
              : Colors.transparent,
          border: Border.all(
            color: isSelected ? AppTheme.primaryPurple : Colors.grey.shade300,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppTheme.primaryPurple
                    : Colors.grey.shade300,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: isSelected ? Colors.white : Colors.grey.shade600,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    mode.displayName,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isSelected
                              ? AppTheme.primaryPurple
                              : Colors.black87,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    mode.description,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              const Icon(
                Icons.check_circle_rounded,
                color: AppTheme.primaryPurple,
              ),
          ],
        ),
      ),
    );
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// CREDENTIALS CARD
  /// ═════════════════════════════════════════════════════════════════════════
  
  Widget _buildCredentialsCard(KycProvider provider) {
    if (provider.mode == AppMode.defaultMode) {
      return Card(
        elevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.successGreen.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle_outline_rounded,
                  color: AppTheme.successGreen,
                  size: 32,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Default Credentials',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Using server-stored credentials',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey.shade600,
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
    
    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Custom Credentials',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _appIdController,
              label: 'App ID',
              hint: 'Enter your app ID',
              icon: Icons.key_rounded,
              onChanged: provider.setAppId,
            ),
            const SizedBox(height: 12),
            _buildTextField(
              controller: _appKeyController,
              label: 'App Key',
              hint: 'Enter your app key',
              icon: Icons.vpn_key_rounded,
              obscure: true,
              onChanged: provider.setAppKey,
            ),
            const SizedBox(height: 12),
            _buildTextField(
              controller: _workflowIdController,
              label: 'Workflow ID',
              hint: 'Enter workflow ID',
              icon: Icons.account_tree_rounded,
              onChanged: provider.setWorkflowId,
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    bool obscure = false,
    required Function(String) onChanged,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.primaryPurple, width: 2),
        ),
      ),
    );
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// WORKFLOW INPUTS CARD
  /// ═════════════════════════════════════════════════════════════════════════
  
  Widget _buildInputsCard(KycProvider provider) {
    if (provider.mode == AppMode.defaultMode) {
      return Card(
        elevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.input_rounded,
                    color: AppTheme.primaryPurple,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Workflow Input',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _manualNameController,
                label: 'MANUALNAME',
                hint: 'Enter your name',
                icon: Icons.person_rounded,
                onChanged: (value) {
                  // Store in provider
                  if (value.isNotEmpty) {
                    provider.clearInputs();
                    provider.addInput(WorkflowInput(
                      key: 'MANUALNAME',
                      value: value,
                      type: InputType.text,
                    ));
                  }
                },
              ),
              const SizedBox(height: 8),
              Text(
                'Required field for rb_sureguard_insurance workflow',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey.shade600,
                    ),
              ),
            ],
          ),
        ),
      );
    }
    
    // Dynamic mode
    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
                    const Icon(
                      Icons.input_rounded,
                      color: AppTheme.primaryPurple,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Workflow Inputs',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.add_circle_rounded),
                  color: AppTheme.primaryPurple,
                  iconSize: 32,
                  onPressed: () => _showAddInputDialog(provider),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_dynamicInputs.isEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline_rounded, color: Colors.grey.shade600),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'No inputs added. Tap + to add workflow inputs',
                        style: TextStyle(color: Colors.grey.shade600),
                      ),
                    ),
                  ],
                ),
              )
            else
              Column(
                children: _dynamicInputs.asMap().entries.map((entry) {
                  final index = entry.key;
                  final input = entry.value;
                  return _buildInputItem(input, index, provider);
                }).toList(),
              ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildInputItem(Map<String, dynamic> input, int index, KycProvider provider) {
    final isFile = input['type'] == 'file';
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: isFile ? AppTheme.accentOrange : AppTheme.primaryPurple,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isFile ? Icons.attach_file_rounded : Icons.text_fields_rounded,
                  color: Colors.white,
                  size: 16,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      input['key'],
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isFile ? input['fileName'] ?? 'No file selected' : input['value'],
                      style: TextStyle(
                        color: Colors.grey.shade700,
                        fontSize: 12,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded),
                color: AppTheme.errorRed,
                onPressed: () {
                  setState(() {
                    _dynamicInputs.removeAt(index);
                    _syncInputsToProvider(provider);
                  });
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  void _showAddInputDialog(KycProvider provider) {
    final keyController = TextEditingController();
    final valueController = TextEditingController();
    String selectedType = 'text';
    File? selectedFile;
    String? selectedFileName;
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Add Workflow Input'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: keyController,
                  decoration: InputDecoration(
                    labelText: 'Input Key',
                    hintText: 'e.g., MANUALNAME',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    prefixIcon: const Icon(Icons.key_rounded),
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: selectedType,
                  decoration: InputDecoration(
                    labelText: 'Input Type',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    prefixIcon: const Icon(Icons.category_rounded),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'text', child: Text('Text')),
                    DropdownMenuItem(value: 'file', child: Text('File Upload')),
                  ],
                  onChanged: (value) {
                    setDialogState(() {
                      selectedType = value!;
                    });
                  },
                ),
                const SizedBox(height: 16),
                if (selectedType == 'text')
                  TextField(
                    controller: valueController,
                    decoration: InputDecoration(
                      labelText: 'Input Value',
                      hintText: 'Enter value',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      prefixIcon: const Icon(Icons.text_fields_rounded),
                    ),
                  )
                else
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ElevatedButton.icon(
                        onPressed: () async {
                          final result = await FilePicker.platform.pickFiles(
                            type: FileType.custom,
                            allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
                          );
                          
                          if (result != null) {
                            setDialogState(() {
                              selectedFile = File(result.files.single.path!);
                              selectedFileName = result.files.single.name;
                            });
                          }
                        },
                        icon: const Icon(Icons.upload_file_rounded),
                        label: const Text('Select File'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.accentOrange,
                          foregroundColor: Colors.white,
                        ),
                      ),
                      if (selectedFileName != null) ...[
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle_rounded, 
                                color: AppTheme.successGreen, size: 16),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  selectedFileName!,
                                  style: const TextStyle(fontSize: 12),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final key = keyController.text.trim();
                
                if (key.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please enter a key')),
                  );
                  return;
                }
                
                if (selectedType == 'text' && valueController.text.trim().isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please enter a value')),
                  );
                  return;
                }
                
                if (selectedType == 'file' && selectedFile == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please select a file')),
                  );
                  return;
                }
                
                setState(() {
                  _dynamicInputs.add({
                    'key': key,
                    'value': selectedType == 'text' ? valueController.text.trim() : selectedFile!.path,
                    'type': selectedType,
                    'fileName': selectedFileName,
                  });
                  _syncInputsToProvider(provider);
                });
                
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryPurple,
                foregroundColor: Colors.white,
              ),
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );
  }
  
  void _syncInputsToProvider(KycProvider provider) {
    provider.clearInputs();
    for (var input in _dynamicInputs) {
      provider.addInput(WorkflowInput(
        key: input['key'],
        value: input['value'],
        type: input['type'] == 'file' ? InputType.file : InputType.text,
        fileName: input['fileName'],
      ));
    }
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// TRANSACTION CARD
  /// ═════════════════════════════════════════════════════════════════════════
  
  Widget _buildTransactionCard(KycProvider provider) {
    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Transaction ID',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            if (provider.hasTransactionId) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.successGreen.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.successGreen),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.fingerprint_rounded,
                      color: AppTheme.successGreen,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        provider.transactionId!,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.w500,
                            ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],
            ElevatedButton.icon(
              onPressed: provider.generateTransactionId,
              icon: const Icon(Icons.refresh_rounded),
              label: Text(
                provider.hasTransactionId
                    ? 'Regenerate ID'
                    : 'Generate Transaction ID',
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accentOrange,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// ACTION BUTTONS
  /// ═════════════════════════════════════════════════════════════════════════
  
  Widget _buildActionButtons(KycProvider provider) {
    return ElevatedButton.icon(
      onPressed: provider.hasTransactionId && !provider.loading
          ? () => _handleInitializeWorkflow(provider)
          : null,
      icon: provider.loading
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : const Icon(Icons.rocket_launch_rounded),
      label: Text(
        provider.loading ? 'Initializing...' : 'Initialize Workflow',
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
      ),
      style: ElevatedButton.styleFrom(
        backgroundColor: AppTheme.primaryPurple,
        foregroundColor: Colors.white,
        disabledBackgroundColor: Colors.grey.shade300,
        disabledForegroundColor: Colors.grey.shade600,
        padding: const EdgeInsets.symmetric(vertical: 18),
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        elevation: 8,
      ),
    );
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// ERROR CARD
  /// ═════════════════════════════════════════════════════════════════════════
  
  Widget _buildErrorCard(KycProvider provider) {
    return Card(
      color: AppTheme.errorRed.withOpacity(0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppTheme.errorRed),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            const Icon(Icons.error_outline_rounded, color: AppTheme.errorRed),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                provider.error!,
                style: const TextStyle(color: AppTheme.errorRed),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.close_rounded, color: AppTheme.errorRed),
              onPressed: provider.clearError,
            ),
          ],
        ),
      ),
    );
  }
  
  /// ═════════════════════════════════════════════════════════════════════════
  /// HANDLER METHODS
  /// ═════════════════════════════════════════════════════════════════════════
  
  Future<void> _handleInitializeWorkflow(KycProvider provider) async {
    // Step 1: Fetch token
    final tokenSuccess = await provider.fetchAccessToken();
    if (!tokenSuccess) return;
    
    // Step 2: Launch SDK
    final sdkSuccess = await provider.launchSDK();
    if (!sdkSuccess) return;
    
    // Step 3: Navigate to results
    if (mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => const ResultsDashboardScreen(),
        ),
      );
    }
  }
}
