#!/usr/bin/env pwsh
# Create a new feature (moved to powershell/)
[CmdletBinding()]
param(
    [switch]$Json,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$FeatureDescription
)
$ErrorActionPreference = 'Stop'

if (-not $FeatureDescription -or $FeatureDescription.Count -eq 0) {
    Write-Error "Usage: ./create-new-feature.ps1 [-Json] <feature description>"; exit 1
}
$featureDesc = ($FeatureDescription -join ' ').Trim()

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
$specsDir = Join-Path $repoRoot 'specs'
New-Item -ItemType Directory -Path $specsDir -Force | Out-Null

$highest = 0
if (Test-Path $specsDir) {
    Get-ChildItem -Path $specsDir -Directory | ForEach-Object {
        if ($_.Name -match '^(\d{3})') {
            $num = [int]$matches[1]
            if ($num -gt $highest) { $highest = $num }
        }
    }
}
$next = $highest + 1
$featureNum = ('{0:000}' -f $next)

$branchName = $featureDesc.ToLower() -replace '[^a-z0-9]', '-' -replace '-{2,}', '-' -replace '^-', '' -replace '-$', ''
$words = ($branchName -split '-') | Where-Object { $_ } | Select-Object -First 3
$branchName = "$featureNum-$([string]::Join('-', $words))"

# Ensure we are inside a git repository; initialize if needed
$insideRepo = $false
try {
    $insideRepoOut = git rev-parse --is-inside-work-tree 2>$null
    if ($insideRepoOut -match 'true') { $insideRepo = $true }
} catch { $insideRepo = $false }
if (-not $insideRepo) {
    git init | Out-Null
}

# Safely create or switch to the branch
# 1) If branch exists, checkout it
# 2) Else, if repo has commits, try -b; fallback to --orphan
# 3) Else, use --orphan for empty repos
try {
    git rev-parse --verify $branchName 2>$null | Out-Null
    $branchExists = ($LASTEXITCODE -eq 0)
} catch {
    $branchExists = $false
}

try {
    git rev-parse --verify HEAD 2>$null | Out-Null
    $hasCommit = ($LASTEXITCODE -eq 0)
} catch {
    $hasCommit = $false
}

${prevEAP} = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    if ($branchExists) {
        git checkout $branchName 2>$null | Out-Null
    } else {
        if ($hasCommit) {
            git checkout -b $branchName 2>$null | Out-Null
            if ($LASTEXITCODE -ne 0) {
                git checkout --orphan $branchName 2>$null | Out-Null
            }
        } else {
            git checkout --orphan $branchName 2>$null | Out-Null
        }
    }
} finally {
    $ErrorActionPreference = ${prevEAP}
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create or switch to branch '$branchName'"; exit 1
}

$featureDir = Join-Path $specsDir $branchName
New-Item -ItemType Directory -Path $featureDir -Force | Out-Null

$template = Join-Path $repoRoot '.specify/templates/spec-template.md'
if (-not (Test-Path $template)) { $template = Join-Path $repoRoot 'templates/spec-template.md' }
$specFile = Join-Path $featureDir 'spec.md'
if (Test-Path $template) { Copy-Item $template $specFile -Force } else { New-Item -ItemType File -Path $specFile | Out-Null }

if ($Json) {
    $obj = [PSCustomObject]@{ BRANCH_NAME = $branchName; SPEC_FILE = $specFile; FEATURE_NUM = $featureNum }
    $obj | ConvertTo-Json -Compress
} else {
    Write-Output "BRANCH_NAME: $branchName"
    Write-Output "SPEC_FILE: $specFile"
    Write-Output "FEATURE_NUM: $featureNum"
}
