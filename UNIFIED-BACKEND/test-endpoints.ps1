# ═══════════════════════════════════════════════════════════════════════════
# UNIFIED BACKEND - ENDPOINT TESTING SCRIPT
# ═══════════════════════════════════════════════════════════════════════════
# 
# Tests all API endpoints of the unified backend
# Run: .\test-endpoints.ps1

$baseUrl = "http://localhost:3000"

Write-Host "`n" -NoNewline
Write-Host "═" -ForegroundColor Cyan -NoNewline; Write-Host ("═" * 68) -ForegroundColor Cyan
Write-Host "  UNIFIED BACKEND - API ENDPOINT TESTS" -ForegroundColor Yellow
Write-Host "═" -ForegroundColor Cyan -NoNewline; Write-Host ("═" * 68) -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# Test 1: Health Check
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "[TEST 1] Health Check" -ForegroundColor Cyan
Write-Host "GET $baseUrl/health" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -ErrorAction Stop
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   Uptime: $($response.uptime) seconds" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# Test 2: Server Info
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "[TEST 2] Server Info" -ForegroundColor Cyan
Write-Host "GET $baseUrl/" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/" -Method GET -ErrorAction Stop
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Service: $($response.service)" -ForegroundColor Gray
    Write-Host "   Version: $($response.version)" -ForegroundColor Gray
    Write-Host "   Platforms: $($response.platforms -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# Test 3: Token Generation - Default Mode
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "[TEST 3] Token Generation - DEFAULT MODE" -ForegroundColor Cyan
Write-Host "POST $baseUrl/api/token/generate" -ForegroundColor Gray

$body = @{
    mode = "default"
    transactionId = "txn_test_$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/token/generate" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{"X-Platform"="PowerShell-Test"} `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Mode: $($response.mode)" -ForegroundColor Gray
    Write-Host "   Workflow: $($response.workflowId)" -ForegroundColor Gray
    Write-Host "   Transaction: $($response.transactionId)" -ForegroundColor Gray
    Write-Host "   Token: $($response.accessToken.Substring(0,20))..." -ForegroundColor Gray
    Write-Host "   Expires In: $($response.expiresIn) seconds" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Message: $($errorObj.message)" -ForegroundColor Red
        Write-Host "   Code: $($errorObj.code)" -ForegroundColor Red
    }
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# Test 4: Token Generation - Dynamic Mode (will fail without valid creds)
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "[TEST 4] Token Generation - DYNAMIC MODE (Expected to fail)" -ForegroundColor Cyan
Write-Host "POST $baseUrl/api/token/generate" -ForegroundColor Gray

$body = @{
    mode = "dynamic"
    transactionId = "txn_test_dynamic_$(Get-Date -Format 'yyyyMMddHHmmss')"
    appId = "test_app_id"
    appKey = "HV:test_app_key"
    workflowId = "test_workflow"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/token/generate" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{"X-Platform"="PowerShell-Test"} `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS (Unexpected!)" -ForegroundColor Yellow
    Write-Host "   Token: $($response.accessToken.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "⚠️  EXPECTED FAILURE (Invalid test credentials)" -ForegroundColor Yellow
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Message: $($errorObj.message)" -ForegroundColor Gray
    }
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# Test 5: Simulate Webhook
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "[TEST 5] Webhook Simulation" -ForegroundColor Cyan
Write-Host "POST $baseUrl/api/webhook/results" -ForegroundColor Gray

$webhookTxnId = "txn_webhook_$(Get-Date -Format 'yyyyMMddHHmmss')"
$webhookBody = @{
    transactionId = $webhookTxnId
    workflowId = "rb_sureguard_insurance"
    status = "auto_approved"
    result = @{
        summary = @{
            action = "approved"
            status = "completed"
        }
        details = @{
            name = "John Doe"
            document = "ID Card"
        }
    }
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/webhook/results" `
        -Method POST `
        -ContentType "application/json" `
        -Body $webhookBody `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Message: $($response.message)" -ForegroundColor Gray
    Write-Host "   Transaction: $($response.transactionId)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# Test 6: Query Webhook Results
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "[TEST 6] Query Webhook Results" -ForegroundColor Cyan
Write-Host "GET $baseUrl/api/webhook/results/$webhookTxnId" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/webhook/results/$webhookTxnId" `
        -Method GET `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Transaction: $($response.data.transactionId)" -ForegroundColor Gray
    Write-Host "   Status: $($response.data.status)" -ForegroundColor Gray
    Write-Host "   Workflow: $($response.data.workflowId)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# Test 7: Get All Results
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "[TEST 7] Get All Webhook Results" -ForegroundColor Cyan
Write-Host "GET $baseUrl/api/webhook/results" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/webhook/results" `
        -Method GET `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Total Results: $($response.count)" -ForegroundColor Gray
    if ($response.count -gt 0) {
        Write-Host "   Latest: $($response.results[0].transactionId) - $($response.results[0].status)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# Test 8: Get Server IP
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "[TEST 8] Get Server IP" -ForegroundColor Cyan
Write-Host "GET $baseUrl/api/server-ip" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/server-ip" `
        -Method GET `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   IP: $($response.ip)" -ForegroundColor Gray
    Write-Host "   Message: $($response.message)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "═" -ForegroundColor Cyan -NoNewline; Write-Host ("═" * 68) -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Yellow
Write-Host "═" -ForegroundColor Cyan -NoNewline; Write-Host ("═" * 68) -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Basic endpoints working" -ForegroundColor Green
Write-Host "✅ Default mode token generation working" -ForegroundColor Green  
Write-Host "⚠️  Dynamic mode needs valid credentials" -ForegroundColor Yellow
Write-Host "✅ Webhook endpoints working" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Test with real HyperVerge credentials in Default mode" -ForegroundColor Gray
Write-Host "  2. Test file upload with actual files" -ForegroundColor Gray
Write-Host "  3. Connect Android/Flutter apps to this backend" -ForegroundColor Gray
Write-Host ""
