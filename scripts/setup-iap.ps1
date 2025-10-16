param(
  [Parameter(Mandatory = $true)] [string] $ProjectId,
  [Parameter(Mandatory = $true)] [string] $Region,
  [Parameter(Mandatory = $true)] [string] $ApiServiceName,
  [Parameter(Mandatory = $true)] [string] $Domain,
  [Parameter(Mandatory = $true)] [string] $NextServiceAccount,
  [string] $SupportEmail = "",
  [string] $NegName = "api-neg",
  [string] $BackendName = "api-backend",
  [string] $UrlMapName = "api-url-map",
  [string] $CertName = "api-cert",
  [string] $ProxyName = "api-https-proxy",
  [string] $AddressName = "api-ip",
  [string] $ForwardingRuleName = "api-https-fr"
)

$ErrorActionPreference = "Stop"

Write-Host "[IAP Setup] Setting gcloud project to $ProjectId"
gcloud config set project $ProjectId --quiet | Out-Null

# 1) IAP Brand and OAuth Client
Write-Host "[IAP Setup] Ensuring IAP OAuth brand exists"
$brandName = ""
try {
  $brandName = (gcloud iap oauth-brands list --format="value(name)" | Select-Object -First 1)
} catch {}
if (-not $brandName) {
  if (-not $SupportEmail) { throw "SupportEmail is required to create an IAP brand" }
  gcloud iap oauth-brands create --application_title="API" --support_email="$SupportEmail" --quiet | Out-Null
  $brandName = (gcloud iap oauth-brands list --format="value(name)" | Select-Object -First 1)
}
if (-not $brandName) { throw "Failed to ensure IAP brand" }
Write-Host "[IAP Setup] Brand: $brandName"

Write-Host "[IAP Setup] Creating/obtaining IAP OAuth client"
$clientResource = ""
try {
  $clientResource = (gcloud iap oauth-clients list $brandName --format="value(name)" | Select-Object -First 1)
} catch {}
if (-not $clientResource) {
  $clientResource = (gcloud iap oauth-clients create $brandName --display_name="API IAP Client" --format="value(name)")
}
if (-not $clientResource) { throw "Failed to create or find IAP OAuth client" }
$clientId = ($clientResource -split "/")[-1]
$clientSecret = (gcloud iap oauth-clients describe $clientResource --format="value(secret)")
Write-Host "[IAP Setup] Client ID: $clientId"

# 2) Cloud Run ingress for LB
Write-Host "[IAP Setup] Updating Cloud Run service ingress for LB"
gcloud run services update $ApiServiceName --region=$Region --ingress=internal-and-cloud-load-balancing --quiet | Out-Null

# 3) Serverless NEG + Backend Service + URL map + Cert + HTTPS Proxy + IP + Forwarding Rule
Write-Host "[IAP Setup] Creating Serverless NEG: $NegName"
gcloud compute network-endpoint-groups create $NegName `
  --region=$Region `
  --network-endpoint-type=serverless `
  --cloud-run-service=$ApiServiceName `
  --quiet | Out-Null

Write-Host "[IAP Setup] Creating Backend Service: $BackendName"
gcloud compute backend-services create $BackendName `
  --global `
  --load-balancing-scheme=EXTERNAL_MANAGED `
  --quiet | Out-Null

Write-Host "[IAP Setup] Adding NEG to Backend Service"
gcloud compute backend-services add-backend $BackendName `
  --global `
  --network-endpoint-group=$NegName `
  --network-endpoint-group-region=$Region `
  --quiet | Out-Null

Write-Host "[IAP Setup] Creating URL Map: $UrlMapName"
gcloud compute url-maps create $UrlMapName --default-service=$BackendName --quiet | Out-Null

Write-Host "[IAP Setup] Creating Managed SSL cert: $CertName for $Domain"
gcloud compute ssl-certificates create $CertName --domains=$Domain --quiet | Out-Null

Write-Host "[IAP Setup] Creating HTTPS Proxy: $ProxyName"
gcloud compute target-https-proxies create $ProxyName `
  --url-map=$UrlMapName `
  --ssl-certificates=$CertName `
  --quiet | Out-Null

Write-Host "[IAP Setup] Reserving Global IP: $AddressName"
gcloud compute addresses create $AddressName --global --quiet | Out-Null
$ApiIp = (gcloud compute addresses describe $AddressName --global --format='value(address)')
Write-Host "[IAP Setup] Reserved Global IP: $ApiIp"

Write-Host "[IAP Setup] Creating HTTPS Forwarding Rule: $ForwardingRuleName"
gcloud compute forwarding-rules create $ForwardingRuleName `
  --global `
  --target-https-proxy=$ProxyName `
  --ports=443 `
  --address=$ApiIp `
  --quiet | Out-Null

Write-Host "[IAP Setup] Configure your DNS: set A record for $Domain -> $ApiIp"

# 4) Enable IAP and grant access to Next service account
Write-Host "[IAP Setup] Enabling IAP on backend service"
gcloud iap web enable --resource-type=backend-services --resource=$BackendName --quiet | Out-Null

Write-Host "[IAP Setup] Granting IAP access to $NextServiceAccount"
gcloud iap web add-iam-policy-binding `
  --resource-type=backend-services `
  --resource=$BackendName `
  --member="serviceAccount:$NextServiceAccount" `
  --role=roles/iap.httpsResourceAccessor `
  --quiet | Out-Null

Write-Host ""
Write-Host "[IAP Setup] Done. Next steps:"
Write-Host "  1) Point DNS A record: $Domain -> $ApiIp"
Write-Host "  2) In frontend (Next) deployment, set envs:"
Write-Host "     - API_BASE_URL=https://$Domain"
Write-Host "     - IAP_AUDIENCE=$clientId"
Write-Host "  3) Deploy Next with service account $NextServiceAccount (Workload Identity), then verify."
Write-Host ""
Write-Host "[IAP Setup] Client ID (IAP_AUDIENCE): $clientId"
if ($clientSecret) { Write-Host "[IAP Setup] Client Secret available via: gcloud iap oauth-clients describe $clientResource --format=\"value(secret)\"" }


