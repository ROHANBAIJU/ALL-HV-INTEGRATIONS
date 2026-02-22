package com.rb.sdktester.ui.screens

import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.rb.sdktester.models.AppMode
import com.rb.sdktester.models.WorkflowInput
import com.rb.sdktester.ui.theme.*

/**
 * Main Input Screen
 * 
 * This screen provides the UI for:
 * - Mode selection (Default vs Dynamic)
 * - Credential inputs (for Dynamic mode)
 * - Transaction ID generation
 * - Workflow initialization
 * 
 * @param appMode Currently selected mode (Default or Dynamic)
 * @param onModeChange Callback when mode is changed
 * @param appId Current app ID input (for Dynamic mode)
 * @param onAppIdChange Callback for app ID changes
 * @param appKey Current app key input (for Dynamic mode)
 * @param onAppKeyChange Callback for app key changes
 * @param workflowId Current workflow ID input
 * @param onWorkflowIdChange Callback for workflow ID changes
 * @param workflowInputs List of workflow input key-value pairs
 * @param onWorkflowInputsChange Callback for workflow inputs changes
 * @param manualName Name input for Default mode workflow (MANUALNAME)
 * @param onManualNameChange Callback for manual name changes
 * @param transactionId Generated transaction ID (null if not generated yet)
 * @param isGeneratingToken Whether token generation is in progress
 * @param onGenerateTransactionId Callback to generate transaction ID
 * @param onInitializeWorkflow Callback to initialize HyperVerge SDK workflow
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InputScreen(
    // Environment toggle
    isProduction: Boolean,
    onEnvironmentToggle: (Boolean) -> Unit,
    isCheckingEnv: Boolean,
    // Mode
    appMode: AppMode,
    onModeChange: (AppMode) -> Unit,
    appId: String,
    onAppIdChange: (String) -> Unit,
    appKey: String,
    onAppKeyChange: (String) -> Unit,
    workflowId: String,
    onWorkflowIdChange: (String) -> Unit,
    workflowInputs: MutableList<WorkflowInput>,
    onWorkflowInputsChange: (MutableList<WorkflowInput>) -> Unit,
    manualName: String,
    onManualNameChange: (String) -> Unit,
    transactionId: String?,
    isGeneratingToken: Boolean,
    onGenerateTransactionId: () -> Unit,
    onInitializeWorkflow: () -> Unit
) {
    var showAppKey by remember { mutableStateOf(false) }

    // File picker state
    val context = LocalContext.current
    val pendingFileIndex = remember { mutableStateOf(-1) }
    val showAttachMenuForIndex = remember { mutableStateOf(-1) }
    val fileLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        val idx = pendingFileIndex.value
        if (uri != null && idx >= 0) {
            val cursor = context.contentResolver.query(uri, null, null, null, null)
            val nameIndex = cursor?.getColumnIndex(OpenableColumns.DISPLAY_NAME) ?: -1
            cursor?.moveToFirst()
            val fileName = if (nameIndex >= 0) cursor?.getString(nameIndex) ?: "attachment" else "attachment"
            cursor?.close()
            val newList = workflowInputs.toMutableList()
            newList[idx] = newList[idx].copy(
                value = uri.toString(),
                isFileInput = true,
                fileName = fileName
            )
            onWorkflowInputsChange(newList)
            pendingFileIndex.value = -1
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
            .verticalScroll(rememberScrollState())
            .padding(24.dp)
    ) {
        
        // Header
        Text(
            text = "RB Android SDK Tester",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = Primary,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        
        Text(
            text = "Test HyperVerge KYC workflows with custom configurations",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            modifier = Modifier.padding(bottom = 32.dp)
        )

        // ========================================================================
        // ENVIRONMENT TOGGLE SECTION
        // ========================================================================

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "Environment",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (isProduction) "Production" else "Development",
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Bold,
                            color = if (isProduction) Success else Info
                        )
                        Text(
                            text = if (isProduction)
                                "Vercel — unified-backend"
                            else
                                "Local — 192.168.0.105:3000",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }

                    if (isCheckingEnv) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(28.dp),
                            color = Primary,
                            strokeWidth = 3.dp
                        )
                    } else {
                        Switch(
                            checked = isProduction,
                            onCheckedChange = onEnvironmentToggle,
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = White,
                                checkedTrackColor = Success,
                                uncheckedThumbColor = White,
                                uncheckedTrackColor = Info
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (isProduction) SuccessBackground else InfoBackground
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (isProduction) "🟢" else "🔵",
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (isProduction)
                                "Requests go to Vercel deployment"
                            else
                                "Requests go to local backend",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (isProduction) SuccessDark else InfoDark
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
        
        // ========================================================================
        // MODE SELECTION SECTION
        // ========================================================================
        
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp)
            ) {
                Text(
                    text = "Select Mode",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Mode Selection Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Default Mode Button
                    ModeButton(
                        text = "Default",
                        description = "Use default credentials",
                        isSelected = appMode == AppMode.DEFAULT,
                        onClick = { onModeChange(AppMode.DEFAULT) },
                        modifier = Modifier.weight(1f)
                    )
                    
                    // Dynamic Mode Button
                    ModeButton(
                        text = "Dynamic",
                        description = "Custom credentials",
                        isSelected = appMode == AppMode.DYNAMIC,
                        onClick = { onModeChange(AppMode.DYNAMIC) },
                        modifier = Modifier.weight(1f)
                    )
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // Mode Description
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (appMode == AppMode.DEFAULT) InfoBackground else WarningBackground
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (appMode == AppMode.DEFAULT) "ℹ️" else "⚙️",
                            style = MaterialTheme.typography.bodyLarge
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (appMode == AppMode.DEFAULT) {
                                "Using default credentials stored in backend"
                            } else {
                                "Enter your custom HyperVerge credentials"
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = if (appMode == AppMode.DEFAULT) InfoDark else WarningDark
                        )
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // ========================================================================
        // DEFAULT MODE INPUT SECTION (Default Mode Only)
        // ========================================================================
        
        if (appMode == AppMode.DEFAULT) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp)
                ) {
                    Text(
                        text = "Workflow Input",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Manual Name Input
                    OutlinedTextField(
                        value = manualName,
                        onValueChange = onManualNameChange,
                        label = { Text("Name (MANUALNAME)") },
                        placeholder = { Text("Enter name for verification") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Primary,
                            unfocusedBorderColor = Grey300,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            cursorColor = Primary
                        )
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    Text(
                        text = "This name will be used as the MANUALNAME input for the default workflow",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
        }
        
        // ========================================================================
        // CREDENTIALS INPUT SECTION (Dynamic Mode Only)
        // ========================================================================
        
        if (appMode == AppMode.DYNAMIC) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp)
                ) {
                    Text(
                        text = "HyperVerge Credentials",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // App ID Input
                    OutlinedTextField(
                        value = appId,
                        onValueChange = onAppIdChange,
                        label = { Text("App ID") },
                        placeholder = { Text("Enter your HyperVerge App ID") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Primary,
                            unfocusedBorderColor = Grey300,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            cursorColor = Primary
                        )
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // App Key Input (with show/hide toggle)
                    OutlinedTextField(
                        value = appKey,
                        onValueChange = onAppKeyChange,
                        label = { Text("App Key") },
                        placeholder = { Text("Enter your HyperVerge App Key") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        visualTransformation = if (showAppKey) {
                            VisualTransformation.None
                        } else {
                            PasswordVisualTransformation()
                        },
                        trailingIcon = {
                            TextButton(onClick = { showAppKey = !showAppKey }) {
                                Text(
                                    text = if (showAppKey) "Hide" else "Show",
                                    style = MaterialTheme.typography.labelMedium
                                )
                            }
                        },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Primary,
                            unfocusedBorderColor = Grey300,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            cursorColor = Primary
                        )
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Workflow ID Input
                    OutlinedTextField(
                        value = workflowId,
                        onValueChange = onWorkflowIdChange,
                        label = { Text("Workflow ID") },
                        placeholder = { Text("Enter your workflow ID") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Primary,
                            unfocusedBorderColor = Grey300,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            cursorColor = Primary
                        )
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // ========================================================================
            // WORKFLOW INPUTS SECTION (Dynamic Mode Only)
            // ========================================================================

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Workflow Inputs",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = TextPrimary
                            )
                            Text(
                                text = "Add text, file, or image inputs",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                        }
                        Button(
                            onClick = {
                                val newList = workflowInputs.toMutableList()
                                newList.add(WorkflowInput("", ""))
                                onWorkflowInputsChange(newList)
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Primary),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Text("+ Add Input", style = MaterialTheme.typography.labelMedium)
                        }
                    }

                    if (workflowInputs.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(16.dp))

                        workflowInputs.forEachIndexed { index, input ->
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                            ) {
                                // Row 1: Key field + Remove
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    OutlinedTextField(
                                        value = input.key,
                                        onValueChange = { newKey ->
                                            val newList = workflowInputs.toMutableList()
                                            newList[index] = input.copy(key = newKey)
                                            onWorkflowInputsChange(newList)
                                        },
                                        label = { Text("Key") },
                                        placeholder = { Text("e.g., MANUALNAME") },
                                        modifier = Modifier.weight(1f),
                                        singleLine = true,
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = Primary,
                                            unfocusedBorderColor = Grey300,
                                            focusedTextColor = TextPrimary,
                                            unfocusedTextColor = TextPrimary,
                                            cursorColor = Primary
                                        )
                                    )
                                    IconButton(
                                        onClick = {
                                            val newList = workflowInputs.toMutableList()
                                            newList.removeAt(index)
                                            onWorkflowInputsChange(newList)
                                        },
                                        modifier = Modifier.size(40.dp)
                                    ) {
                                        Text("✕", style = MaterialTheme.typography.titleMedium, color = Error)
                                    }
                                }

                                Spacer(modifier = Modifier.height(6.dp))

                                // Row 2: Value (text or file chip) + Attach button
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    if (input.isFileInput) {
                                        Surface(
                                            modifier = Modifier.weight(1f),
                                            shape = RoundedCornerShape(8.dp),
                                            color = InfoBackground,
                                            border = BorderStroke(1.dp, InfoDark.copy(alpha = 0.3f))
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 14.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text("📎", style = MaterialTheme.typography.bodyMedium)
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text(
                                                    text = input.fileName ?: "Selected file",
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = InfoDark,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis,
                                                    modifier = Modifier.weight(1f)
                                                )
                                            }
                                        }
                                    } else {
                                        OutlinedTextField(
                                            value = input.value,
                                            onValueChange = { newValue ->
                                                val newList = workflowInputs.toMutableList()
                                                newList[index] = input.copy(value = newValue)
                                                onWorkflowInputsChange(newList)
                                            },
                                            label = { Text("Value") },
                                            placeholder = { Text("Text value or attach →") },
                                            modifier = Modifier.weight(1f),
                                            singleLine = true,
                                            colors = OutlinedTextFieldDefaults.colors(
                                                focusedBorderColor = Primary,
                                                unfocusedBorderColor = Grey300,
                                                focusedTextColor = TextPrimary,
                                                unfocusedTextColor = TextPrimary,
                                                cursorColor = Primary
                                            )
                                        )
                                    }

                                    // Attach button + dropdown
                                    Box {
                                        OutlinedButton(
                                            onClick = { showAttachMenuForIndex.value = index },
                                            contentPadding = PaddingValues(8.dp),
                                            modifier = Modifier.size(48.dp),
                                            shape = RoundedCornerShape(8.dp),
                                            border = BorderStroke(1.dp, if (input.isFileInput) Primary else Grey300),
                                            colors = ButtonDefaults.outlinedButtonColors(
                                                contentColor = if (input.isFileInput) Primary else TextSecondary
                                            )
                                        ) {
                                            Text("📎", style = MaterialTheme.typography.bodyLarge)
                                        }
                                        DropdownMenu(
                                            expanded = showAttachMenuForIndex.value == index,
                                            onDismissRequest = { showAttachMenuForIndex.value = -1 }
                                        ) {
                                            DropdownMenuItem(
                                                text = { Text("📂  Pick any file") },
                                                onClick = {
                                                    pendingFileIndex.value = index
                                                    showAttachMenuForIndex.value = -1
                                                    fileLauncher.launch("*/*")
                                                }
                                            )
                                            DropdownMenuItem(
                                                text = { Text("🖼️  Pick image / photo") },
                                                onClick = {
                                                    pendingFileIndex.value = index
                                                    showAttachMenuForIndex.value = -1
                                                    fileLauncher.launch("image/*")
                                                }
                                            )
                                            if (input.isFileInput) {
                                                HorizontalDivider()
                                                DropdownMenuItem(
                                                    text = { Text("✏️  Switch to text") },
                                                    onClick = {
                                                        val newList = workflowInputs.toMutableList()
                                                        newList[index] = input.copy(
                                                            value = "",
                                                            isFileInput = false,
                                                            fileName = null
                                                        )
                                                        onWorkflowInputsChange(newList)
                                                        showAttachMenuForIndex.value = -1
                                                    }
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                            if (index < workflowInputs.size - 1) {
                                HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                            }
                        }
                    } else {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "No inputs yet — click '+ Add Input' to add text, file, or image inputs.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
        
        // ========================================================================
        // TRANSACTION ID SECTION
        // ========================================================================
        
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp)
            ) {
                Text(
                    text = "Transaction ID",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                Text(
                    text = "Each verification session requires a unique transaction ID",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                if (transactionId != null) {
                    // Display Generated Transaction ID
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = SuccessBackground
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "✓",
                                style = MaterialTheme.typography.titleLarge,
                                color = Success,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Transaction ID Generated",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = SuccessDark,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = transactionId,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = SuccessDark
                                )
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Regenerate Button
                    OutlinedButton(
                        onClick = onGenerateTransactionId,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Generate New ID")
                    }
                } else {
                    // Generate Button
                    Button(
                        onClick = onGenerateTransactionId,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Info
                        )
                    ) {
                        Text(
                            text = "Generate Transaction ID",
                            style = MaterialTheme.typography.titleMedium
                        )
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // ========================================================================
        // INITIALIZE WORKFLOW BUTTON
        // ========================================================================
        
        val canInitialize = when (appMode) {
            AppMode.DEFAULT -> transactionId != null
            AppMode.DYNAMIC -> transactionId != null && 
                              appId.isNotBlank() && 
                              appKey.isNotBlank() && 
                              workflowId.isNotBlank()
        }
        
        Button(
            onClick = onInitializeWorkflow,
            enabled = canInitialize && !isGeneratingToken,
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (canInitialize) Success else Grey400,
                disabledContainerColor = Grey300
            )
        ) {
            if (isGeneratingToken) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = White,
                    strokeWidth = 3.dp
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "Initializing...",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            } else {
                Text(
                    text = "🚀 Initialize Workflow",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            }
        }
        
        if (!canInitialize) {
            Spacer(modifier = Modifier.height(12.dp))
            
            Text(
                text = when {
                    transactionId == null -> "⚠️ Please generate a transaction ID first"
                    appMode == AppMode.DYNAMIC && appId.isBlank() -> "⚠️ Please enter App ID"
                    appMode == AppMode.DYNAMIC && appKey.isBlank() -> "⚠️ Please enter App Key"
                    appMode == AppMode.DYNAMIC && workflowId.isBlank() -> "⚠️ Please enter Workflow ID"
                    else -> ""
                },
                style = MaterialTheme.typography.bodySmall,
                color = Error,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }
        
        Spacer(modifier = Modifier.height(40.dp))
    }
}

/**
 * Mode Selection Button Component
 */
@Composable
fun ModeButton(
    text: String,
    description: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Button(
        onClick = onClick,
        modifier = modifier.height(80.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = if (isSelected) Primary else Grey200,
            contentColor = if (isSelected) White else TextPrimary
        ),
        elevation = if (isSelected) {
            ButtonDefaults.buttonElevation(defaultElevation = 4.dp)
        } else {
            ButtonDefaults.buttonElevation(defaultElevation = 0.dp)
        }
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = text,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = description,
                style = MaterialTheme.typography.labelSmall,
                textAlign = TextAlign.Center
            )
        }
    }
}
