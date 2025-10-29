param(
  [Parameter(Mandatory=$true)][string]$FeatureDir
)

$ErrorActionPreference = 'Stop'
$dir = Join-Path $FeatureDir 'checklists'

if (-not (Test-Path $dir -PathType Container)) {
  Write-Output "No checklists directory found at: $dir"
  exit 0
}

$files = Get-ChildItem -Path $dir -Filter *.md -File -ErrorAction SilentlyContinue
if (-not $files) {
  Write-Output "No checklist files found in: $dir"
  exit 0
}

$rows = @()
$totalOpen = 0
$totalDone = 0

foreach ($f in $files) {
  $open = (Select-String -Path $f.FullName -Pattern "- \[ \]" -AllMatches -SimpleMatch -ErrorAction SilentlyContinue).Matches.Count
  $done = (Select-String -Path $f.FullName -Pattern "- \[[xX]\]" -AllMatches -ErrorAction SilentlyContinue).Matches.Count
  $totalOpen += $open
  $totalDone += $done
  $rows += [PSCustomObject]@{ File=$f.Name; Open=$open; Done=$done }
}

Write-Output "Checklist Status:"
$rows | Sort-Object File | Format-Table -AutoSize | Out-String | Write-Output
Write-Output "Totals: Open=$totalOpen, Done=$totalDone"
if ($totalOpen -gt 0) {
  Write-Output "OVERALL: FAIL"
  exit 2
} else {
  Write-Output "OVERALL: PASS"
  exit 0
}

