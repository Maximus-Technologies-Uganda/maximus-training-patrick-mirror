Param(
  [Parameter(Mandatory = $true)]
  [string]$Json
)

# Parse JSON input or accept raw string
$description = $null
try {
  $obj = $Json | ConvertFrom-Json -ErrorAction Stop
  if ($obj -is [string]) {
    $description = [string]$obj
  } elseif ($obj.PSObject.Properties.Name -contains 'description') {
    $description = [string]$obj.description
  } else {
    $description = $Json
  }
} catch {
  $description = $Json
}

function New-Slug([string]$text) {
  if ([string]::IsNullOrWhiteSpace($text)) { return "feature" }
  $t = $text.ToLowerInvariant()
  $t = [regex]::Replace($t, "[^a-z0-9]+", "-")
  $t = $t.Trim("-")
  if ($t.Length -gt 64) { $t = $t.Substring(0, 64).Trim("-") }
  return $t
}

$slug = New-Slug $description
$date = Get-Date -Format "yyyy-MM-dd"
$branchName = "spec/$date-$slug"

try {
  $top = git rev-parse --show-toplevel 2>$null
  if ($top) {
    $repoRoot = $top.Trim()
  } else {
    $repoRoot = (Get-Location).Path
  }
} catch {
  $repoRoot = (Get-Location).Path
}
$specDirRoot = Join-Path $repoRoot ".specify"
$specsDir = Join-Path $specDirRoot "specs"
$templateDir = Join-Path $specDirRoot "templates"
$templatePath = Join-Path $templateDir "spec-template.md"
if (-not (Test-Path $specsDir)) { New-Item -ItemType Directory -Path $specsDir -Force | Out-Null }

$fileName = "$date-$slug.md"
$specFile = Join-Path $specsDir $fileName

# Initialize spec file using template if present
if (-not (Test-Path $specFile)) {
  if (Test-Path $templatePath) {
    Copy-Item -Path $templatePath -Destination $specFile -Force
  } else {
    New-Item -ItemType File -Path $specFile -Force | Out-Null
  }
}

# Ensure git repository and switch to branch
$insideRepo = $false
try {
  $insideRepoOut = git rev-parse --is-inside-work-tree 2>$null
  if ($insideRepoOut -match "true") { $insideRepo = $true }
} catch { $insideRepo = $false }

if (-not $insideRepo) {
  git init | Out-Null
}

try {
  git checkout -b $branchName 2>$null | Out-Null
} catch {
  try { git checkout $branchName 2>$null | Out-Null } catch { git checkout --orphan $branchName 2>$null | Out-Null }
}

# Output machine-readable result
$result = [ordered]@{
  BRANCH_NAME = $branchName
  SPEC_FILE   = (Resolve-Path $specFile).Path
}
$result | ConvertTo-Json -Depth 5

 
