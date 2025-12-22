Write-Host "========================================" -ForegroundColor Green
Write-Host "HTTPSサーバーを起動しています..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "ブラウザで https://localhost:5500 を開いてください" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  自己署名証明書を使用しています。" -ForegroundColor Yellow
Write-Host "   ブラウザで「詳細設定」→「続行」をクリックしてください。" -ForegroundColor Yellow
Write-Host ""
Write-Host "停止するには Ctrl+C を押してください" -ForegroundColor Yellow
Write-Host ""
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
node https-server.js


