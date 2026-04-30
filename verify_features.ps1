##############################################
# Cloud-Nest Feature Verification Script
# Tests: Billing, Intelligence, Audit, DB Functions
##############################################

$BASE = "http://localhost:8080"
$pass = 0
$fail = 0

function Test-Result($name, $condition, $detail) {
    if ($condition) {
        Write-Host "  PASS  " -ForegroundColor Black -BackgroundColor Green -NoNewline
        Write-Host " $name" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "  FAIL  " -ForegroundColor White -BackgroundColor Red -NoNewline
        Write-Host " $name - $detail" -ForegroundColor Red
        $script:fail++
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  CLOUD-NEST FEATURE VERIFICATION" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --------------------------------------------------
# STEP 1: Login to get a JWT token
# --------------------------------------------------
Write-Host "[Step 1] Authentication" -ForegroundColor Yellow
Write-Host "Enter your credentials to get a JWT token:"
$subdomain = Read-Host "  Subdomain (e.g. testcorp)"
$email     = Read-Host "  Email"
$password  = Read-Host "  Password"

$loginBody = @{ email=$email; password=$password; subdomain=$subdomain } | ConvertTo-Json
try {
    $loginResp = Invoke-RestMethod -Uri "$BASE/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResp.token
    Test-Result "Login successful" ($token.Length -gt 10) ""
} catch {
    Test-Result "Login" $false "Could not login. Check credentials. Error: $($_.Exception.Message)"
    Write-Host "`nCannot continue without a valid token. Exiting." -ForegroundColor Red
    exit 1
}

$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

# Get tenant_id from DB
$tenantId = (docker exec cloudnest_postgres psql -U root -d cloudnest -t -A -c "SELECT id FROM tenants WHERE subdomain='$subdomain';").Trim()
Test-Result "Tenant ID resolved: $tenantId" ($tenantId.Length -eq 36) "Could not find tenant"

Write-Host ""

# --------------------------------------------------
# STEP 2: Test existing features (Products, Orders, Customers)
# --------------------------------------------------
Write-Host "[Step 2] Core E-Commerce APIs" -ForegroundColor Yellow

try {
    $products = Invoke-RestMethod -Uri "$BASE/api/v1/products" -Headers $headers -Method Get
    Test-Result "GET /products" $true ""
} catch { Test-Result "GET /products" $false $_.Exception.Message }

try {
    $orders = Invoke-RestMethod -Uri "$BASE/api/v1/orders" -Headers $headers -Method Get
    Test-Result "GET /orders" $true ""
} catch { Test-Result "GET /orders" $false $_.Exception.Message }

try {
    $customers = Invoke-RestMethod -Uri "$BASE/api/v1/customers" -Headers $headers -Method Get
    Test-Result "GET /customers" $true ""
} catch { Test-Result "GET /customers" $false $_.Exception.Message }

Write-Host ""

# --------------------------------------------------
# STEP 3: Test Billing Module
# --------------------------------------------------
Write-Host "[Step 3] Billing Module" -ForegroundColor Yellow

# Generate an invoice
try {
    $invoice = Invoke-RestMethod -Uri "$BASE/api/v1/billing/invoices/$tenantId/generate" -Headers $headers -Method Post
    Test-Result "POST /billing/invoices/generate (201)" ($invoice.id -ne $null) ""
    $invoiceId = $invoice.id
} catch { Test-Result "POST /billing/invoices/generate" $false $_.Exception.Message; $invoiceId = $null }

# List invoices
try {
    $invoices = Invoke-RestMethod -Uri "$BASE/api/v1/billing/invoices?tenantId=$tenantId" -Headers $headers -Method Get
    Test-Result "GET /billing/invoices (list)" ($invoices.Count -ge 1) "Expected at least 1 invoice"
} catch { Test-Result "GET /billing/invoices" $false $_.Exception.Message }

# Get single invoice
if ($invoiceId) {
    try {
        $single = Invoke-RestMethod -Uri "$BASE/api/v1/billing/invoices/$invoiceId" -Headers $headers -Method Get
        Test-Result "GET /billing/invoices/{id}" ($single.id -eq $invoiceId) ""
    } catch { Test-Result "GET /billing/invoices/{id}" $false $_.Exception.Message }

    # Update invoice status to 'paid'
    try {
        $statusBody = '{"status":"paid"}'
        $updated = Invoke-RestMethod -Uri "$BASE/api/v1/billing/invoices/$invoiceId/status" -Headers $headers -Method Put -Body $statusBody
        Test-Result "PUT /billing/invoices/{id}/status -> paid" ($updated.status -eq "paid") "Status: $($updated.status)"
    } catch { Test-Result "PUT /billing/invoices/{id}/status" $false $_.Exception.Message }

    # Test invalid status (should fail)
    try {
        $badBody = '{"status":"invalid_status"}'
        Invoke-RestMethod -Uri "$BASE/api/v1/billing/invoices/$invoiceId/status" -Headers $headers -Method Put -Body $badBody
        Test-Result "PUT invalid status rejected" $false "Should have thrown error"
    } catch {
        Test-Result "PUT invalid status rejected (400)" $true ""
    }
}

Write-Host ""

# --------------------------------------------------
# STEP 4: Test Database Tables
# --------------------------------------------------
Write-Host "[Step 4] Database Tables Verification" -ForegroundColor Yellow

$expectedTables = @("tenants","users","products","orders","customers","api_metrics",
                     "tenant_forecasts","anomalies","interventions",
                     "billing_plans","invoices","usage_snapshots","audit_logs")

$existingTables = docker exec cloudnest_postgres psql -U root -d cloudnest -t -A -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"
foreach ($t in $expectedTables) {
    Test-Result "Table exists: $t" ($existingTables -match $t) "Table not found"
}

Write-Host ""

# --------------------------------------------------
# STEP 5: Test Stored Functions
# --------------------------------------------------
Write-Host "[Step 5] PostgreSQL Stored Functions" -ForegroundColor Yellow

try {
    $forecastResult = docker exec cloudnest_postgres psql -U root -d cloudnest -t -A -c "SELECT forecast_all_tenants();"
    Test-Result "forecast_all_tenants() executed" ($forecastResult -ne $null) ""
    Write-Host "         Tenants processed: $($forecastResult.Trim())" -ForegroundColor DarkGray
} catch { Test-Result "forecast_all_tenants()" $false $_.Exception.Message }

try {
    $anomalyResult = docker exec cloudnest_postgres psql -U root -d cloudnest -t -A -c "SELECT detect_usage_anomalies();"
    Test-Result "detect_usage_anomalies() executed" ($anomalyResult -ne $null) ""
    Write-Host "         Anomalies detected: $($anomalyResult.Trim())" -ForegroundColor DarkGray
} catch { Test-Result "detect_usage_anomalies()" $false $_.Exception.Message }

try {
    $overageResult = docker exec cloudnest_postgres psql -U root -d cloudnest -t -A -c "SELECT forecast_tenant_overage('$tenantId');"
    Test-Result "forecast_tenant_overage() executed" ($overageResult -ne $null) ""
    Write-Host "         Result: $($overageResult.Trim())" -ForegroundColor DarkGray
} catch { Test-Result "forecast_tenant_overage()" $false $_.Exception.Message }

Write-Host ""

# --------------------------------------------------
# STEP 6: Test Audit Triggers
# --------------------------------------------------
Write-Host "[Step 6] Audit Log Triggers" -ForegroundColor Yellow

$auditCount = (docker exec cloudnest_postgres psql -U root -d cloudnest -t -A -c "SELECT COUNT(*) FROM audit_logs;").Trim()
Test-Result "Audit logs table accessible" ($auditCount -ne $null) ""
Write-Host "         Total audit log entries: $auditCount" -ForegroundColor DarkGray

# Check if audit trigger captured our invoice creation
$invoiceAudits = (docker exec cloudnest_postgres psql -U root -d cloudnest -t -A -c "SELECT COUNT(*) FROM audit_logs WHERE table_name='invoices';").Trim()
Test-Result "Invoice audit trigger firing" ([int]$invoiceAudits -ge 1) "Expected audit entries for invoice operations"
Write-Host "         Invoice audit entries: $invoiceAudits" -ForegroundColor DarkGray

Write-Host ""

# --------------------------------------------------
# STEP 7: Test RLS Policies
# --------------------------------------------------
Write-Host "[Step 7] Row Level Security Policies" -ForegroundColor Yellow

$policies = docker exec cloudnest_postgres psql -U root -d cloudnest -t -A -c "SELECT tablename, policyname FROM pg_policies;"
$rlsTables = @("tenant_forecasts","anomalies","interventions","invoices","usage_snapshots")
foreach ($t in $rlsTables) {
    Test-Result "RLS policy on: $t" ($policies -match $t) "No RLS policy found"
}

Write-Host ""

# --------------------------------------------------
# SUMMARY
# --------------------------------------------------
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Passed: $pass" -ForegroundColor Green
Write-Host "  Failed: $fail" -ForegroundColor $(if($fail -gt 0){"Red"}else{"Green"})
Write-Host "  Total:  $($pass + $fail)" -ForegroundColor Cyan
Write-Host ""

if ($fail -eq 0) {
    Write-Host "  ALL FEATURES VERIFIED SUCCESSFULLY!" -ForegroundColor Black -BackgroundColor Green
} else {
    Write-Host "  SOME FEATURES NEED ATTENTION" -ForegroundColor White -BackgroundColor Red
}
Write-Host ""
