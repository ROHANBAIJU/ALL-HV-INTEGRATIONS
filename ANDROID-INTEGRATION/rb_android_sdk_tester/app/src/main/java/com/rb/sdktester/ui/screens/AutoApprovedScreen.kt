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
 * Auto-Approved Result Screen
 * 
 * Displayed when the HyperVerge SDK workflow completes with status: "auto_approved"
 * Indicates that the user's verification was successful and automatically approved.
 * 
 * @param transactionId Unique transaction identifier for this verification session
 * @param workflowId Workflow ID used for this verification
 * @param details Additional details from SDK response (optional)
 * @param onDone Callback when user clicks "Done" or "Start New" button
 */
@Composable
fun AutoApprovedScreen(
    transactionId: String?,
    workflowId: String?,
    details: Map<String, String>?,
    onDone: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SuccessBackground)
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        
        // Success Icon
        Box(
            modifier = Modifier
                .size(120.dp)
                .clip(CircleShape)
                .background(Success),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "✅",
                fontSize = 72.sp
            )
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Title
        Text(
            text = "Verification Successful!",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = SuccessDark,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Status Badge
        Surface(
            modifier = Modifier.padding(horizontal = 16.dp),
            shape = RoundedCornerShape(20.dp),
            color = SuccessContainer
        ) {
            Text(
                text = "AUTO APPROVED",
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp),
                style = MaterialTheme.typography.labelLarge,
                color = SuccessDark,
                fontWeight = FontWeight.Bold
            )
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Description
        Text(
            text = "Your KYC verification has been automatically approved. All checks passed successfully.",
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
                    text = "Verification Details",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Transaction ID
                if (!transactionId.isNullOrEmpty()) {
                    DetailRow(
                        label = "Transaction ID",
                        value = transactionId
                    )
                }
                
                // Workflow ID
                if (!workflowId.isNullOrEmpty()) {
                    DetailRow(
                        label = "Workflow",
                        value = workflowId
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
                    label = "Completed At",
                    value = java.text.SimpleDateFormat(
                        "MMM dd, yyyy - hh:mm a",
                        java.util.Locale.getDefault()
                    ).format(java.util.Date())
                )
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Success Message
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            shape = RoundedCornerShape(12.dp),
            color = Success.copy(alpha = 0.1f)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "🎉",
                    fontSize = 24.sp
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "You're all set! Your verification is complete.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = SuccessDark
                )
            }
        }
        
        Spacer(modifier = Modifier.height(40.dp))
        
        // Action Buttons
        Button(
            onClick = onDone,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 8.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Success,
                contentColor = White
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text(
                text = "Start New Verification",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        OutlinedButton(
            onClick = onDone,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 8.dp),
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = Success
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text(
                text = "Done",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

/**
 * Reusable detail row component for displaying key-value pairs
 */
@Composable
private fun DetailRow(label: String, value: String) {
    Column(modifier = Modifier.padding(vertical = 8.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = TextSecondary,
            fontWeight = FontWeight.Medium
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = TextPrimary,
            fontWeight = FontWeight.Normal
        )
    }
}
