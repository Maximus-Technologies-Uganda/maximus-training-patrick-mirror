$ErrorActionPreference = 'Stop'

# Paths
$toolsDir = ".cursor/.agent-tools"
$postIdFile = Join-Path $toolsDir 'post-id.txt'
$aliceLoginOut = Join-Path $toolsDir 'alice-login.http'
$aliceCreateOut = Join-Path $toolsDir 'alice-create.http'
$adminLoginOut = Join-Path $toolsDir 'admin-login.http'
$adminDeleteOut = Join-Path $toolsDir 'admin-delete.http'

# Ensure tools dir exists
if (-not (Test-Path $toolsDir)) {
  New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null
}

$apiBase = 'http://localhost:3000'
$headers = @{ 'Content-Type' = 'application/json' }

# 1) Login as Alice
$aliceBody = @{ username = 'alice'; password = 'correct-password' } | ConvertTo-Json -Compress
$aliceResp = Invoke-WebRequest -UseBasicParsing -Method POST -Headers $headers -Body $aliceBody -SessionVariable aliceSess "$apiBase/auth/login"
("HTTP/{0} {1}" -f $aliceResp.ProtocolVersion, [int]$aliceResp.StatusCode) | Set-Content -Path $aliceLoginOut

# 2) Create a post as Alice
$createBody = @{ title = 'Owned by Alice'; content = 'Evidence post for 403' } | ConvertTo-Json -Compress
$createResp = Invoke-WebRequest -UseBasicParsing -Method POST -Headers $headers -Body $createBody -WebSession $aliceSess "$apiBase/posts"
$createStatus = ("HTTP/{0} {1}" -f $createResp.ProtocolVersion, [int]$createResp.StatusCode)
$createStatus | Set-Content -Path $aliceCreateOut

# Extract post id from Location header or response JSON
$postId = $null
if ($createResp.Headers.Location) {
  $loc = $createResp.Headers.Location | Select-Object -First 1
  $postId = ($loc -split '/')[-1]
}
if (-not $postId) {
  try {
    $postId = (ConvertFrom-Json $createResp.Content).id
  } catch { }
}
if (-not $postId) { throw 'Failed to capture post id from create response.' }
$postId | Set-Content -Path $postIdFile

# 3) Login as Admin
$adminBody = @{ username = 'admin'; password = 'password' } | ConvertTo-Json -Compress
$adminResp = Invoke-WebRequest -UseBasicParsing -Method POST -Headers $headers -Body $adminBody -SessionVariable adminSess "$apiBase/auth/login"
("HTTP/{0} {1}" -f $adminResp.ProtocolVersion, [int]$adminResp.StatusCode) | Set-Content -Path $adminLoginOut

# 4) Attempt to delete Alice's post as Admin (expect 403)
$deleteUrl = "$apiBase/posts/$postId"
try {
  $deleteResp = Invoke-WebRequest -UseBasicParsing -Method DELETE -WebSession $adminSess $deleteUrl -ErrorAction Stop
  # If it did not throw, capture status
  ("HTTP/{0} {1}" -f $deleteResp.ProtocolVersion, [int]$deleteResp.StatusCode) | Set-Content -Path $adminDeleteOut
} catch {
  if ($_.Exception.Response) {
    $resp = $_.Exception.Response
    $statusLine = ("HTTP/{0} {1}" -f $resp.ProtocolVersion, [int]$resp.StatusCode)
    $statusLine | Set-Content -Path $adminDeleteOut
  } else {
    throw
  }
}
