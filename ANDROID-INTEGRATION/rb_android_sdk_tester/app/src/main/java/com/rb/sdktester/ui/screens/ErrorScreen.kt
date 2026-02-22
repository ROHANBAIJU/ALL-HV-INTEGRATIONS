package com.rb.sdktester.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rb.sdktester.ui.theme.*

/**
 * Error Result Screen
 * 
 * Displayed when the HyperVerge SDK workflow completes with status: "error"
 * or when any technical error occurs during the verification process.
 * 
 * @param transactionId Unique transaction identifier
 * @param workflowId Workflow ID used
 * @param errorCode Error code from SDK or backend
 * @param errorMessage Error message describing what went wrong
 * @param details Additional error details (optional)
 * @param onRetry Callback when user clicks "Retry" button
 */
@Composable
fun ErrorScreen(
    transactionId: String?,
    workflowId: String?,
    errorCode: String?,
    errorMessage: String?,
    details: Map<String, String>?,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ErrorBackground)
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        
        // Error Icon
        Box(
            modifier = Modifier
                .size(120.dp)
                .clip(CircleShape)
                .background(Error),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "⚠️",
                fontSize = 72.sp
            )
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Title
        Text(
            text = "Verification Error",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = ErrorDark,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Status Badge
        Surface(
            modifier = Modifier.padding(horizontal = 16.dp),
            shape = RoundedCornerShape(20.dp),
            color = ErrorContainer
        ) {
            Text(
                text = "ERROR",
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp),
                style = MaterialTheme.typography.labelLarge,
                color = ErrorDark,
                fontWeight = FontWeight.Bold
            )
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Description
        Text(
            text = errorMessage ?: "An error occurred during the verification process. Please check the details below and try again.",
            style = MaterialTheme.typography.bodyLarge,
            color = TextPrimary,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Error Details Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = White
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp)
            ) {
                Text(
                    text = "Error Details",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Error Code
                errorCode?.let {
                    DetailRow(
                        label = "Error Code",
                        value = it,
                        isError = true
                    )
                }
                
                // Error Message (detailed)
                errorMessage?.let {
                    DetailRow(
                        label = "Error Message",
                        value = it,
                        isError = true
                    )
                }
                
                // Transaction ID
                transactionId?.let {
                    DetailRow(
                        label = "Transaction ID",
                        value = it
                    )
                }
                
                // Workflow ID
                workflowId?.let {
                    DetailRow(
                        label = "Workflow",
                        value = it
                    )
                }
                
                // Additional Details
                details?.forEach { (key, value) ->
                    DetailRow(
                        label = key.replace("_", " ").capitalize(),
                        value = value
                    )
                }
                
                // Timestamp
                DetailRow(
                    label = "Error Occurred At",
                    value = java.text.SimpleDateFormat(
                        "MMM dd, yyyy - hh:mm a",
                        java.util.Locale.getDefault()
                    ).format(java.util.Date())
                )
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Troubleshooting Tips Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(
                containerColor = Error.copy(alpha = 0.05f)
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "💡",
                        fontSize = 20.sp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Troubleshooting Tips",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = ErrorDark
                    )
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                TipItem("Check your internet connection")
                TipItem("Ensure camera permissions are granted")
                TipItem("Verify your credentials are correct")
                TipItem("Try restarting the app")
            }
        }
        
        Spacer(modifier = Modifier.height(40.dp))
        
        // Action Buttons
        Button(
            onClick = onRetry,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 8.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Error,
                contentColor = White
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text(
                text = "Retry Verification",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        OutlinedButton(
            onClick = onRetry,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 8.dp),
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = Error
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text(
                text = "Back to Home",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String, isError: Boolean = false) {
    Column(modifier = Modifier.padding(vertical = 8.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = if (isError) ErrorDark else TextSecondary,
            fontWeight = FontWeight.Medium
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = if (isError) Error else TextPrimary,
            fontWeight = if (isError) FontWeight.SemiBold else FontWeight.Normal
        )
    }
}

@Composable
private fun TipItem(text: String) {
    Row(
        modifier = Modifier.padding(vertical = 4.dp),
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = "• ",
            style = MaterialTheme.typography.bodyMedium,
            color = ErrorDark
        )
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = ErrorDark
        )
    }
}
