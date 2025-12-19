Write-Host "ローカルサーバーを起動しています..." -ForegroundColor Green
Write-Host "ブラウザで http://localhost:5500 を開いてください" -ForegroundColor Yellow
Write-Host "停止するには Ctrl+C を押してください" -ForegroundColor Yellow
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
npx live-server --port=5500 --open=/index.html

