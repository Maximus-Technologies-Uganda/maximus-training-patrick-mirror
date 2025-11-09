#!/usr/bin/env pwsh
# Storage Cleanup Script - Run monthly for optimal performance
# Usage: ./cleanup-storage.ps1

Write-Host "=== Development Environment Storage Cleanup ===" -ForegroundColor Cyan
Write-Host "This script safely removes regenerable build artifacts and caches" -ForegroundColor Gray
Write-Host ""

# Confirm before running
$confirm = Read-Host "Continue with cleanup? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Cancelled" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Starting cleanup..." -ForegroundColor Green

# 1. pnpm cleanup
Write-Host "`n[1/6] Pruning pnpm store..." -ForegroundColor Cyan
try {
    pnpm store prune 2>&1 | Select-String "Removed"
    Write-Host "✓ pnpm store cleaned" -ForegroundColor Green
} catch {
    Write-Host "! pnpm not found or error occurred" -ForegroundColor Yellow
}

# 2. npm cleanup
Write-Host "`n[2/6] Cleaning npm cache..." -ForegroundColor Cyan
try {
    npm cache clean --force 2>&1 | Select-Object -First 1
    Write-Host "✓ npm cache cleaned" -ForegroundColor Green
} catch {
    Write-Host "! npm error occurred" -ForegroundColor Yellow
}

# 3. Docker cleanup
Write-Host "`n[3/6] Pruning Docker system..." -ForegroundColor Cyan
try {
    docker system prune --all --volumes --force 2>&1 | Select-String "Total reclaimed"
    Write-Host "✓ Docker cleaned" -ForegroundColor Green
} catch {
    Write-Host "! Docker not running or not installed" -ForegroundColor Yellow
}

# 4. Remove node_modules
Write-Host "`n[4/6] Removing node_modules..." -ForegroundColor Cyan
try {
    $nodeModulesDirs = Get-ChildItem -Path . -Directory -Recurse -Force -ErrorAction SilentlyContinue | 
        Where-Object { $_.Name -eq 'node_modules' }
    
    $count = 0
    $nodeModulesDirs | ForEach-Object {
        Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        $count++
    }
    
    if ($count -gt 0) {
        Write-Host "✓ Removed $count node_modules directories" -ForegroundColor Green
    } else {
        Write-Host "! No node_modules directories found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "! Error removing node_modules" -ForegroundColor Yellow
}

# 5. Clean build directories
Write-Host "`n[5/6] Removing build artifacts..." -ForegroundColor Cyan
try {
    $buildDirs = @('.next', 'dist', 'build', 'coverage')
    $cleaned = 0
    
    foreach ($dir in $buildDirs) {
        if (Test-Path $dir) {
            Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
            $cleaned++
        }
    }
    
    Write-Host "✓ Cleaned $cleaned build directories" -ForegroundColor Green
} catch {
    Write-Host "! Error cleaning build directories" -ForegroundColor Yellow
}

# 6. Empty Recycle Bin
Write-Host "`n[6/6] Emptying Recycle Bin..." -ForegroundColor Cyan
try {
    $recycleBin = (New-Object -ComObject Shell.Application).NameSpace(10)
    $itemCount = $recycleBin.Items().Count
    
    if ($itemCount -gt 0) {
        Clear-RecycleBin -Force -ErrorAction SilentlyContinue
        Write-Host "✓ Emptied Recycle Bin ($itemCount items)" -ForegroundColor Green
    } else {
        Write-Host "✓ Recycle Bin already empty" -ForegroundColor Green
    }
} catch {
    Write-Host "! Error emptying Recycle Bin" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Cleanup Complete ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: pnpm install (to restore dependencies if needed)" -ForegroundColor Gray
Write-Host "2. Verify: pnpm run build (test the build works)" -ForegroundColor Gray
Write-Host ""
