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
 * Needs Review Result Screen
 * 
 * Displayed when the HyperVerge SDK workflow completes with status: "needs_review"
 * Indicates that the verification result is ambiguous and requires manual review.
 * 
 * @param transactionId Unique transaction identifier
 * @param workflowId Workflow ID used
 * @param details Additional details (optional)
 * @param onOkay Callback when user clicks "Okay" button
 */
@Composable
fun NeedsReviewScreen(
    transactionId: String?,
    workflowId: String?,
    details: Map<String, String>?,
    onOkay: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(WarningBackground)
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        
        // Review Icon
        Box(
            modifier = Modifier
                .size(120.dp)
                .clip(CircleShape)
                .background(Warning),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "🔍",
                fontSize = 72.sp
            )
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Title
        Text(
            text = "Manual Review Required",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = WarningDark,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Status Badge
        Surface(
            modifier = Modifier.padding(horizontal = 16.dp),
            shape = RoundedCornerShape(20.dp),
            color = WarningContainer
        ) {
            Text(
                text = "NEEDS REVIEW",
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp),
                style = MaterialTheme.typography.labelLarge,
                color = WarningDark,
                fontWeight = FontWeight.Bold
            )
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Description
        Text(
            text = "Your verification is pending manual review. You will be notified once the review is complete.",
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
                    text = "Review Details",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Transaction ID (Important for tracking)
                transactionId?.let {
                    DetailRow(
                        label = "Transaction ID",
                        value = it,
                        important = true
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
                    label = "Submitted At",
                    value = java.text.SimpleDateFormat(
                        "MMM dd, yyyy - hh:mm a",
                        java.util.Locale.getDefault()
                    ).format(java.util.Date())
                )
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Info Message
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            shape = RoundedCornerShape(12.dp),
            color = Warning.copy(alpha = 0.1f)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "⏳",
                    fontSize = 24.sp
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "Please keep your transaction ID for reference.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = WarningDark,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "You'll be notified when the review is complete.",
                        style = MaterialTheme.typography.bodySmall,
                        color = WarningDark
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(40.dp))
        
        // Action Button
        Button(
            onClick = onOkay,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(horizontal = 8.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Warning,
                contentColor = White
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text(
                text = "Okay, Got It",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String, important: Boolean = false) {
    Column(modifier = Modifier.padding(vertical = 8.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = if (important) WarningDark else TextSecondary,
            fontWeight = if (important) FontWeight.Bold else FontWeight.Medium
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = if (important) WarningDark else TextPrimary,
            fontWeight = if (important) FontWeight.SemiBold else FontWeight.Normal
        )
    }
}
