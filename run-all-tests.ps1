param([switch]$KeepServers)

function Start-Backend {
    Write-Host "Starting backend..." -ForegroundColor Cyan
    $script:BackendProcess = Start-Process -FilePath "C:\Program Files\nodejs\npm.cmd" -ArgumentList "run","start:dev" -WorkingDirectory "C:\Users\kapun\Desktop\Syncora\syncora-backend" -NoNewWindow -PassThru -RedirectStandardOutput "$env:TEMP\backend-out.log" -RedirectStandardError "$env:TEMP\backend-err.log"
    
    Write-Host "Waiting 30s for backend to compile and start..." -ForegroundColor Yellow
    $waited = 0
    $ready = $false
    while ($waited -lt 40) {
        Start-Sleep -Seconds 2
        $waited += 2
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/me" -Method GET -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($r.StatusCode -eq 401) { $ready = $true; break }
        } catch { if ($_.Exception.Response.StatusCode -eq 401) { $ready = $true; break } }
        Write-Host "  ... waiting $waited s" -ForegroundColor DarkYellow
    }
    if (-not $ready) { Write-Host "Backend failed to start" -ForegroundColor Red; exit 1 }
    Write-Host "Backend is ready!" -ForegroundColor Green
}

function Invoke-Api {
    param($Method, $Uri, $Body, $Session, $ExpectedStatus)
    try {
        $params = @{ Method = $Method; Uri = $Uri; UseBasicParsing = $true; ErrorAction = "Stop" }
        if ($Body) { $params.Body = $Body; $params.ContentType = "application/json" }
        if ($Session) { $params.WebSession = $Session }
        $r = Invoke-WebRequest @params
        $actual = $r.StatusCode
        if ($ExpectedStatus -and $actual -ne $ExpectedStatus) {
            Write-Host "  FAIL: Expected $ExpectedStatus, got $actual" -ForegroundColor Red
            return $null
        }
        Write-Host "  PASS ($actual)" -ForegroundColor Green
        return $r
    } catch {
        $actual = $_.Exception.Response.StatusCode.value__
        if ($ExpectedStatus -and $actual -eq $ExpectedStatus) {
            Write-Host "  PASS ($actual)" -ForegroundColor Green
            return $null
        }
        Write-Host "  FAIL: Expected $ExpectedStatus, got $_" -ForegroundColor Red
        return $null
    }
}

# ========== AUTH FLOW ==========
Write-Host "`n=========================================" -ForegroundColor Magenta
Write-Host "TESTS 1-6: AUTHENTICATION" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

# T1: Register
Write-Host "`nT1: POST /api/auth/register (valid)" -ForegroundColor Blue
$body = @{ name = "Test Tech"; email = "tester@syncora.com"; password = "StrongPass1!"; role = "TECHNICIAN" } | ConvertTo-Json
$r = Invoke-Api -Method POST -Uri "http://localhost:3001/api/auth/register" -Body $body -ExpectedStatus 201
$userId = ""
if ($r) { $content = $r.Content | ConvertFrom-Json; $userId = $content.id; Write-Host "  Created user: $($content.name) ($($content.id))" -ForegroundColor Gray }
$global:testUserId = $userId

# T2: Duplicate email -> 409
Write-Host "`nT1b: POST /api/auth/register (duplicate) -> 409" -ForegroundColor Blue
Invoke-Api -Method POST -Uri "http://localhost:3001/api/auth/register" -Body $body -ExpectedStatus 409

# T3: Register weak password -> 400
Write-Host "`nT1c: POST /api/auth/register (weak pw) -> 400" -ForegroundColor Blue
$bodyWeak = @{ name = "Weak"; email = "weak@test.com"; password = "123"; role = "TECHNICIAN" } | ConvertTo-Json
Invoke-Api -Method POST -Uri "http://localhost:3001/api/auth/register" -Body $bodyWeak -ExpectedStatus 400

# T4: Register missing fields -> 400
Write-Host "`nT1d: POST /api/auth/register (missing fields) -> 400" -ForegroundColor Blue
$bodyBad = @{ name = "Bad" } | ConvertTo-Json
Invoke-Api -Method POST -Uri "http://localhost:3001/api/auth/register" -Body $bodyBad -ExpectedStatus 400

# T5: Login as moderator
Write-Host "`nT2a: POST /api/auth/login (moderator) -> 200 + cookies" -ForegroundColor Blue
$global:modSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$body = @{ email = "john_doe@syncora.com"; password = "Moderator1!" } | ConvertTo-Json
$r = Invoke-WebRequest -Method POST -Uri "http://localhost:3001/api/auth/login" -Body $body -ContentType "application/json" -UseBasicParsing -SessionVariable "modSesh" -ErrorAction Stop
if ($r.StatusCode -eq 201 -or $r.StatusCode -eq 200) { 
    Write-Host "  PASS ($($r.StatusCode))" -ForegroundColor Green 
    $global:modSession = $modSesh
} else { Write-Host "  FAIL: $($r.StatusCode)" -ForegroundColor Red }
Write-Host "  Cookies: $($r.Headers['Set-Cookie'])" -ForegroundColor Gray

# T6: Login as technician
Write-Host "`nT2b: POST /api/auth/login (technician) -> 200 + cookies" -ForegroundColor Blue
$global:techSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$body = @{ email = "alice_tech@syncora.com"; password = "Technician1!" } | ConvertTo-Json
$r = Invoke-WebRequest -Method POST -Uri "http://localhost:3001/api/auth/login" -Body $body -ContentType "application/json" -UseBasicParsing -SessionVariable "techSesh" -ErrorAction Stop
if ($r.StatusCode -eq 201 -or $r.StatusCode -eq 200) { 
    Write-Host "  PASS ($($r.StatusCode))" -ForegroundColor Green 
    $global:techSession = $techSesh
} else { Write-Host "  FAIL: $($r.StatusCode)" -ForegroundColor Red }

# T7: Login as customer
Write-Host "`nT2c: POST /api/auth/login (customer) -> 200 + cookies" -ForegroundColor Blue
$global:custSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$body = @{ email = "charlie_cust@syncora.com"; password = "Customer1!" } | ConvertTo-Json
$r = Invoke-WebRequest -Method POST -Uri "http://localhost:3001/api/auth/login" -Body $body -ContentType "application/json" -UseBasicParsing -SessionVariable "custSesh" -ErrorAction Stop
if ($r.StatusCode -eq 201 -or $r.StatusCode -eq 200) { 
    Write-Host "  PASS ($($r.StatusCode))" -ForegroundColor Green 
    $global:custSession = $custSesh
} else { Write-Host "  FAIL: $($r.StatusCode)" -ForegroundColor Red }

# T8: Wrong password -> 401
Write-Host "`nT2d: POST /api/auth/login (wrong pw) -> 401" -ForegroundColor Blue
$body = @{ email = "john_doe@syncora.com"; password = "WrongPassword1!" } | ConvertTo-Json
Invoke-Api -Method POST -Uri "http://localhost:3001/api/auth/login" -Body $body -ExpectedStatus 401

# T9: Auth/me as moderator -> 200
Write-Host "`nT5a: GET /api/auth/me (mod) -> 200" -ForegroundColor Blue
$r = Invoke-WebRequest -Method GET -Uri "http://localhost:3001/api/auth/me" -UseBasicParsing -WebSession $global:modSession -ErrorAction Stop
if ($r.StatusCode -eq 200) { 
    Write-Host "  PASS (200)" -ForegroundColor Green
    $me = $r.Content | ConvertFrom-Json
    Write-Host "  User: $($me.name) role=$($me.role)" -ForegroundColor Gray
} else { Write-Host "  FAIL: $($r.StatusCode)" -ForegroundColor Red }

# T10: Auth/me without auth -> 401
Write-Host "`nT5b: GET /api/auth/me (no auth) -> 401" -ForegroundColor Blue
Invoke-Api -Method GET -Uri "http://localhost:3001/api/auth/me" -ExpectedStatus 401

# T11: Refresh token
Write-Host "`nT3: POST /api/auth/refresh -> 200" -ForegroundColor Blue
$r = Invoke-WebRequest -Method POST -Uri "http://localhost:3001/api/auth/refresh" -UseBasicParsing -WebSession $global:modSession -ErrorAction Stop
if ($r.StatusCode -eq 200 -or $r.StatusCode -eq 201) { 
    Write-Host "  PASS ($($r.StatusCode))" -ForegroundColor Green
    Write-Host "  New cookies: $($r.Headers['Set-Cookie'])" -ForegroundColor Gray
} else { Write-Host "  FAIL: $($r.StatusCode)" -ForegroundColor Red }

# T12: Logout
Write-Host "`nT4: POST /api/auth/logout -> 200" -ForegroundColor Blue
Invoke-Api -Method POST -Uri "http://localhost:3001/api/auth/logout" -Session $global:modSession -ExpectedStatus 200

# ========== USERS ==========
Write-Host "`n=========================================" -ForegroundColor Magenta
Write-Host "TESTS 7-12: USERS" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

# Login again since we logged out
Write-Host "`n[Re-login mod]" -ForegroundColor Cyan
$global:modSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$body = @{ email = "john_doe@syncora.com"; password = "Moderator1!" } | ConvertTo-Json
$r = Invoke-WebRequest -Method POST -Uri "http://localhost:3001/api/auth/login" -Body $body -ContentType "application/json" -UseBasicParsing -SessionVariable "modSesh" -ErrorAction Stop
$global:modSession = $modSesh

# T13: GET /api/users
Write-Host "`nT13: GET /api/users -> 200" -ForegroundColor Blue
$r = Invoke-WebRequest -Method GET -Uri "http://localhost:3001/api/users" -UseBasicParsing -WebSession $global:modSession -ErrorAction Stop
if ($r.StatusCode -eq 200) { 
    Write-Host "  PASS (200)" -ForegroundColor Green
    $users = $r.Content | ConvertFrom-Json
    Write-Host "  Users count: $($users.Count)" -ForegroundColor Gray
    $users | Select-Object name, email, role | Format-Table -AutoSize
} else { Write-Host "  FAIL: $($r.StatusCode)" -ForegroundColor Red }

# T14: GET /api/users?role=TECHNICIAN
Write-Host "`nT14: GET /api/users?role=TECHNICIAN -> 200" -ForegroundColor Blue
$r = Invoke-WebRequest -Method GET -Uri "http://localhost:3001/api/users?role=TECHNICIAN" -UseBasicParsing -WebSession $global:modSession -ErrorAction Stop
if ($r.StatusCode -eq 200) { 
    Write-Host "  PASS (200)" -ForegroundColor Green
    $users = $r.Content | ConvertFrom-Json
    Write-Host "  Technicians: $($users.Count)" -ForegroundColor Gray
} else { Write-Host "  FAIL: $($r.StatusCode)" -ForegroundColor Red }

# ========== WORK ORDERS ==========
Write-Host "`n=========================================" -ForegroundColor Magenta
Write-Host "TESTS 13-19: WORK ORDERS" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

# T15: GET /api/work-orders (mod)
Write-Host "`nT15: GET /api/work-orders (mod) -> 200" -ForegroundColor Blue
$r = Invoke-WebRequest -Method GET -Uri "http://localhost:3001/api/work-orders" -UseBasicParsing -WebSession $global:modSession -ErrorAction Stop
if ($r.StatusCode -eq 200) { 
    Write-Host "  PASS (200)" -ForegroundColor Green
    $orders = $r.Content | ConvertFrom-Json
    Write-Host "  Orders count: $($orders.Count)" -ForegroundColor Gray
    $orders | Select-Object orderNumber, title, status | Format-Table -AutoSize
    $global:firstOrderId = $orders[0].id
    $global:firstOrderNum = $orders[0].orderNumber
} else { Write-Host "  FAIL: $($r.StatusCode)" -ForegroundColor Red }

# T16: POST /api/work-orders (mod creates)
Write-Host "`nT16: POST /api/work-orders (mod) -> 201" -ForegroundColor Blue
# Find a customer ID
$r = Invoke-WebRequest -Method GET -Uri "http://localhost:3001/api/users?role=CUSTOMER" -UseBasicParsing -WebSession $global:modSession -ErrorAction Stop
$cust = ($r.Content | ConvertFrom-Json)[0]
Write-Host "  Customer: $($cust.name) ($($cust.id))" -ForegroundColor Gray

$body = @{
    title = "Test Work Order via API"
    description = "Created during automated testing"
    priority = "URGENT"
    customerId = $cust.id
    location = @{ address = "123 Test St, Springfield" }
    scheduledStart = (Get-Date).AddHours(1).ToString("o")
    scheduledEnd = (Get-Date).AddHours(5).ToString("o")
} | ConvertTo-Json -Depth 3

$r = Invoke-WebRequest -Method POST -Uri "http://localhost:3001/api/work-orders" -Body $body -ContentType "application/json" -UseBasicParsing -WebSession $global:modSession -ErrorAction Stop
if ($r.StatusCode -eq 201) { 
    Write-Host "  PASS (201)" -ForegroundColor Green
    $wo = $r.Content | ConvertFrom-Json
    Write-Host "  Created: $($wo.orderNumber) - $($wo.title)" -ForegroundColor Gray
    $global:newOrderId = $wo.id
} else { Write-Host "  FAIL: $($r.StatusCode)" -ForegroundColor Red }

# T17: POST /api/work-orders (technician cannot create)
Write-Host "`nT17: POST /api/work-orders (tech) -> 403" -ForegroundColor Blue
$body = @{ title = "Bad"; description = "should fail"; priority = "LOW"; customerId = $cust.id } | ConvertTo-Json
Invoke-Api -Method POST -Uri "http://localhost:3001/api/work-orders" -Body $body -Session $global:techSession -ExpectedStatus 403

# T18: POST /api/work-orders (customer can create for self)
Write-Host "`nT18: POST /api/work-orders (customer self) -> 201" -ForegroundColor Blue
$body = @{
    title = "Customer Self Order"
    description = "I need help"
    priority = "MEDIUM"
    location = @{ address = "456 Home St" }
    scheduledStart = (Get-Date).AddDays(1).ToString("o")
    scheduledEnd = (Get-Date).AddDays(1).AddHours(3).ToString("o")
} | ConvertTo-Json -Depth 3
$r = Invoke-Api -Method POST -Uri "http://localhost:3001/api/work-orders" -Body $body -Session $global:custSession -ExpectedStatus 201
if ($r) { $global:custOrderId = ($r.Content | ConvertFrom-Json).id }

# T19: PATCH /api/work-orders/:id (mod update)
Write-Host "`nT19: PATCH /api/work-orders/:id (mod) -> 200" -ForegroundColor Blue
$body = @{ title = "Updated Title - API Test" } | ConvertTo-Json
Invoke-Api -Method PATCH -Uri "http://localhost:3001/api/work-orders/$($global:newOrderId)" -Body $body -Session $global:modSession -ExpectedStatus 200

# T20: GET /api/work-orders/:id (technician - their own)
Write-Host "`nT20: GET /api/work-orders (tech) -> 200" -ForegroundColor Blue
$r = Invoke-WebRequest -Method GET -Uri "http://localhost:3001/api/work-orders" -UseBasicParsing -WebSession $global:techSession -ErrorAction Stop
$techOrders = $r.Content | ConvertFrom-Json
Write-Host "  Tech sees $($techOrders.Count) orders" -ForegroundColor Gray

# T21: GET /api/work-orders (customer - their own)
Write-Host "`nT21: GET /api/work-orders (cust) -> 200" -ForegroundColor Blue
$r = Invoke-WebRequest -Method GET -Uri "http://localhost:3001/api/work-orders" -UseBasicParsing -WebSession $global:custSession -ErrorAction Stop
$custOrders = $r.Content | ConvertFrom-Json
Write-Host "  Customer sees $($custOrders.Count) orders" -ForegroundColor Gray

# T22: VALID STATUS TRANSITION (PENDING -> EN_ROUTE by technician)
Write-Host "`nT22: PATCH /api/work-orders/:id/status (valid transition) -> 200" -ForegroundColor Blue
if ($global:newOrderId) {
    $body = @{ status = "EN_ROUTE"; note = "On my way!" } | ConvertTo-Json
    Invoke-Api -Method PATCH -Uri "http://localhost:3001/api/work-orders/$($global:newOrderId)/status" -Body $body -Session $global:modSession -ExpectedStatus 200
}

# T23: INVALID STATUS TRANSITION
Write-Host "`nT23: PATCH /api/work-orders/:id/status (invalid transition) -> 400" -ForegroundColor Blue
if ($global:newOrderId) {
    $body = @{ status = "COMPLETED"; note = "Skip" } | ConvertTo-Json
    Invoke-Api -Method PATCH -Uri "http://localhost:3001/api/work-orders/$($global:newOrderId)/status" -Body $body -Session $global:modSession -ExpectedStatus 400
}

# T24: ASSIGN order to technician
Write-Host "`nT24: PATCH /api/work-orders/:id/assign -> 200" -ForegroundColor Blue
# Find technician ID
$r = Invoke-WebRequest -Method GET -Uri "http://localhost:3001/api/users?role=TECHNICIAN" -UseBasicParsing -WebSession $global:modSession -ErrorAction Stop
$tech = ($r.Content | ConvertFrom-Json)[0]
Write-Host "  Assigning to: $($tech.name) ($($tech.id))" -ForegroundColor Gray
$body = @{ technicianId = $tech.id } | ConvertTo-Json
Invoke-Api -Method PATCH -Uri "http://localhost:3001/api/work-orders/$($global:newOrderId)/assign" -Body $body -Session $global:modSession -ExpectedStatus 200

# T25: Assign to non-technician -> 400
Write-Host "`nT25: PATCH /api/work-orders/:id/assign (non-tech) -> 400" -ForegroundColor Blue
$body = @{ technicianId = $cust.id } | ConvertTo-Json
Invoke-Api -Method PATCH -Uri "http://localhost:3001/api/work-orders/$($global:newOrderId)/assign" -Body $body -Session $global:modSession -ExpectedStatus 400

# ========== NOTIFICATIONS ==========
Write-Host "`n=========================================" -ForegroundColor Magenta
Write-Host "TESTS 25-30: NOTIFICATIONS" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

# T26: GET /api/notifications
Write-Host "`nT26: GET /api/notifications -> 200" -ForegroundColor Blue
$r = Invoke-WebRequest -Method GET -Uri "http://localhost:3001/api/notifications" -UseBasicParsing -WebSession $global:modSession -ErrorAction Stop
if ($r.StatusCode -eq 200) { 
    Write-Host "  PASS (200)" -ForegroundColor Green
    $notifs = $r.Content | ConvertFrom-Json
    Write-Host "  Notifications count: $($notifs.Count)" -ForegroundColor Gray
} else { Write-Host "  FAIL: $($r.StatusCode)" -ForegroundColor Red }

# T27: GET /api/notifications/unread-count
Write-Host "`nT27: GET /api/notifications/unread-count -> 200" -ForegroundColor Blue
$r = Invoke-WebRequest -Method GET -Uri "http://localhost:3001/api/notifications/unread-count" -UseBasicParsing -WebSession $global:modSession -ErrorAction Stop
if ($r.StatusCode -eq 200) { 
    Write-Host "  PASS (200)" -ForegroundColor Green
    $cnt = $r.Content | ConvertFrom-Json
    Write-Host "  Unread: $($cnt.count)" -ForegroundColor Gray
    $global:unreadCount = $cnt.count
} else { Write-Host "  FAIL: $($r.StatusCode)" -ForegroundColor Red }

# T28: GET /api/notifications/preferences
Write-Host "`nT28: GET /api/notifications/preferences -> 200" -ForegroundColor Blue
$r = Invoke-WebRequest -Method GET -Uri "http://localhost:3001/api/notifications/preferences" -UseBasicParsing -WebSession $global:modSession -ErrorAction Stop
if ($r.StatusCode -eq 200) { 
    Write-Host "  PASS (200)" -ForegroundColor Green
    $prefs = $r.Content | ConvertFrom-Json
    Write-Host "  Prefs keys: $(($prefs | Get-Member -MemberType NoteProperty).Name)" -ForegroundColor Gray
} else { Write-Host "  FAIL: $($r.StatusCode)" -ForegroundColor Red }

# T29: PUT /api/notifications/preferences
Write-Host "`nT29: PUT /api/notifications/preferences -> 200" -ForegroundColor Blue
$body = @{ email = $false; push = $true } | ConvertTo-Json
Invoke-Api -Method PUT -Uri "http://localhost:3001/api/notifications/preferences" -Body $body -Session $global:modSession -ExpectedStatus 200

# T30: PATCH /api/notifications/:id/read (mark first unread as read)
Write-Host "`nT30: PATCH /api/notifications/:id/read -> 200" -ForegroundColor Blue
$r = Invoke-WebRequest -Method GET -Uri "http://localhost:3001/api/notifications" -UseBasicParsing -WebSession $global:modSession -ErrorAction Stop
$notifs = $r.Content | ConvertFrom-Json
if ($notifs.Count -gt 0) {
    $firstNotifId = $notifs[0].id
    Invoke-Api -Method PATCH -Uri "http://localhost:3001/api/notifications/$firstNotifId/read" -Session $global:modSession -ExpectedStatus 200
    Write-Host "  Marked $firstNotifId as read" -ForegroundColor Gray
}

# ========== LOCATIONS ==========
Write-Host "`n=========================================" -ForegroundColor Magenta
Write-Host "TESTS 31-33: LOCATIONS" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

# T31: GET /api/locations/technician/:id
Write-Host "`nT31: GET /api/locations/technician/:id -> 200" -ForegroundColor Blue
$r = Invoke-WebRequest -Method GET -Uri "http://localhost:3001/api/users?role=TECHNICIAN" -UseBasicParsing -WebSession $global:modSession -ErrorAction Stop
$tech = ($r.Content | ConvertFrom-Json)[0]
Invoke-Api -Method GET -Uri "http://localhost:3001/api/locations/technician/$($tech.id)" -Session $global:modSession -ExpectedStatus 200

# T32: GET /api/locations/work-order/:id
Write-Host "`nT32: GET /api/locations/work-order/:id -> 200" -ForegroundColor Blue
Invoke-Api -Method GET -Uri "http://localhost:3001/api/locations/work-order/$($global:firstOrderId)" -Session $global:modSession -ExpectedStatus 200

# ========== SECURITY ==========
Write-Host "`n=========================================" -ForegroundColor Magenta
Write-Host "TESTS 34-36: SECURITY" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

# T34: Customer cannot access technician-only endpoint
Write-Host "`nT34: GET /api/locations/technician/:id (customer) -> 403" -ForegroundColor Blue
$r = Invoke-WebRequest -Method GET -Uri "http://localhost:3001/api/users?role=TECHNICIAN" -UseBasicParsing -WebSession $global:modSession -ErrorAction Stop
$tech = ($r.Content | ConvertFrom-Json)[0]
Invoke-Api -Method GET -Uri "http://localhost:3001/api/locations/technician/$($tech.id)" -Session $global:custSession -ExpectedStatus 403

# T35: Customer cannot see another's work order
Write-Host "`nT35: GET /api/work-orders/:id (wrong customer) -> 403" -ForegroundColor Blue
if ($global:custOrderId -and $global:newOrderId) {
    # Try to access the mod-created order (not owned by this customer)
    # Use a second customer
    $body2 = @{ email = "diana_cust@syncora.com"; password = "Customer1!" } | ConvertTo-Json
    $dianaSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $r = Invoke-WebRequest -Method POST -Uri "http://localhost:3001/api/auth/login" -Body $body2 -ContentType "application/json" -UseBasicParsing -SessionVariable "dianaSesh" -ErrorAction Stop
    $dianaSession = $dianaSesh
    
    # Diana tries to access charlie's order
    if ($global:custOrderId) { Invoke-Api -Method GET -Uri "http://localhost:3001/api/work-orders/$($global:custOrderId)" -Session $dianaSession -ExpectedStatus 403 }
}

# T36: Unauthenticated endpoint access
Write-Host "`nT36: GET /api/users (no auth) -> 401" -ForegroundColor Blue
Invoke-Api -Method GET -Uri "http://localhost:3001/api/users" -ExpectedStatus 401

# ========== SUMMARY ==========
Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "TESTING COMPLETE" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Servers running: backend on :3001, frontend on :3000" -ForegroundColor Yellow
if ($KeepServers) { Write-Host "Servers will keep running (--KeepServers flag set)" -ForegroundColor Yellow }
