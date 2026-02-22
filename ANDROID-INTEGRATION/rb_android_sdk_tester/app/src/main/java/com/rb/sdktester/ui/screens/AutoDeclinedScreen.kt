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
 * Auto-Declined Result Screen
 * 
 * Displayed when the HyperVerge SDK workflow completes with status: "auto_declined"
 * Indicates that the user's verification failed and was automatically declined.
 * 
 * @param transactionId Unique transaction identifier
 * @param workflowId Workflow ID used
 * @param errorCode Error code from SDK (optional)
 * @param errorMessage Error message from SDK (optional)
 * @param details Additional details (optional)
 * @param onRetry Callback when user clicks "Try Again" button
 */
@Composable
fun AutoDeclinedScreen(
    transactionId: String?,
    workflowId: String?,
    errorCode: Int?,
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
                text = "❌",
                fontSize = 72.sp
            )
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Title
        Text(
            text = "Verification Declined",
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
                text = "AUTO DECLINED",
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp),
                style = MaterialTheme.typography.labelLarge,
                color = ErrorDark,
                fontWeight = FontWeight.Bold
            )
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Description
        Text(
            text = "The verification process was declined. Please review the details and try again with valid information.",
            style = MaterialTheme.typography.bodyLarge,
            color = TextPrimary,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Details Card
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
                    text = "Decline Details",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Error Code
                errorCode?.let {
                    DetailRow(
                        label = "Error Code",
                        value = it.toString(),
                        isError = true
                    )
                }
                
                // Error Message
                errorMessage?.let {
                    DetailRow(
                        label = "Reason",
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
                    label = "Declined At",
                    value = java.text.SimpleDateFormat(
                        "MMM dd, yyyy - hh:mm a",
                        java.util.Locale.getDefault()
                    ).format(java.util.Date())
                )
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Warning Message
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            shape = RoundedCornerShape(12.dp),
            color = Error.copy(alpha = 0.1f)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "⚠️",
                    fontSize = 24.sp
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "Please ensure all documents are clear and valid before retrying.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = ErrorDark
                )
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
                text = "Try Again",
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
