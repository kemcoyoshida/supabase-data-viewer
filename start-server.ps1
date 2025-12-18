Write-Host "ローカルサーバーを起動しています..." -ForegroundColor Green
Write-Host "ブラウザで http://localhost:8080 を開いてください" -ForegroundColor Yellow
Write-Host "停止するには Ctrl+C を押してください" -ForegroundColor Yellow
Set-Location $PSScriptRoot
npx http-server -p 8080 -o

