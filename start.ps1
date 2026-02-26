# Claw Jarvis - PowerShell 启动脚本
# 右键 -> "使用 PowerShell 运行"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Claw Jarvis - 你的贾维斯助手" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path $PSScriptRoot

# 检查 Node.js
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found!" -ForegroundColor Red
    Write-Host "Install from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# 检查依赖
if (!(Test-Path "node_modules")) {
    Write-Host "[!] Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Installation failed!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "[OK] Dependencies found" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting app..." -ForegroundColor Cyan
Write-Host ""

npm start

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Read-Host "Press Enter to close"
