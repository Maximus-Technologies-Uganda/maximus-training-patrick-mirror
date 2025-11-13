#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Backup and verify the critical 001-frontend-ssr-hardening folder
.DESCRIPTION
    This script creates a backup of the entire specs/001-frontend-ssr-hardening folder
    and verifies all critical files are present.
.EXAMPLE
    .\scripts/backup-specs-folder.ps1
#>

param(
    [string]$BackupDir = "backups/specs-001-ssr-hardening-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
)

# Critical files that must exist
$CriticalFiles = @(
    "specs/001-frontend-ssr-hardening/tasks.md",
    "specs/001-frontend-ssr-hardening/plan.md",
    "specs/001-frontend-ssr-hardening/spec.md",
    "specs/001-frontend-ssr-hardening/research.md",
    "specs/001-frontend-ssr-hardening/data-model.md",
    "specs/001-frontend-ssr-hardening/contracts/openapi.yaml",
    "specs/001-frontend-ssr-hardening/contracts/query.zod.ts",
    "specs/001-frontend-ssr-hardening/checklists/requirements.md",
    "specs/001-frontend-ssr-hardening/checklists/requirements-quality.md"
)

Write-Host "🔍 Verifying critical files exist..." -ForegroundColor Cyan
$AllPresent = $true
foreach ($file in $CriticalFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ MISSING: $file" -ForegroundColor Red
        $AllPresent = $false
    }
}

if (-not $AllPresent) {
    Write-Host "`n🚨 CRITICAL FILES MISSING!" -ForegroundColor Red
    Write-Host "Restore with: git checkout 8c411829 -- specs/001-frontend-ssr-hardening/" -ForegroundColor Yellow
    exit 1
}

# Create backup
Write-Host "`n📦 Creating backup to: $BackupDir" -ForegroundColor Cyan
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
Copy-Item -Path "specs/001-frontend-ssr-hardening" -Destination $BackupDir -Recurse -Force

# Create checksum file
Write-Host "📋 Creating checksum file..." -ForegroundColor Cyan
$ChecksumFile = "$BackupDir/CHECKSUM.txt"
$Checksums = Get-ChildItem -Path "$BackupDir/001-frontend-ssr-hardening" -Recurse -File | ForEach-Object {
    $Hash = (Get-FileHash $_.FullName -Algorithm SHA256).Hash
    "$Hash  $($_.Name)"
}
$Checksums | Out-File $ChecksumFile -Encoding UTF8

Write-Host "✅ Backup complete!" -ForegroundColor Green
Write-Host "   Location: $BackupDir" -ForegroundColor Green
Write-Host "   Files: $($CriticalFiles.Count) files" -ForegroundColor Green
Write-Host "`n📝 Backup verified and ready for recovery if needed." -ForegroundColor Cyan
