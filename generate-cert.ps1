Write-Host "自己署名証明書を生成しています..." -ForegroundColor Green
Write-Host ""

if (-not (Test-Path "certs")) {
    New-Item -ItemType Directory -Path "certs" | Out-Null
}

Write-Host "OpenSSLを使用して証明書を生成します..." -ForegroundColor Yellow
Write-Host ""

try {
    openssl req -x509 -newkey rsa:2048 -keyout certs\key.pem -out certs\cert.pem -days 365 -nodes -subj "/C=JP/ST=Tokyo/L=Tokyo/O=Test/CN=localhost"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "証明書の生成が完了しました！" -ForegroundColor Green
        Write-Host "certs\key.pem と certs\cert.pem が作成されました。" -ForegroundColor Green
    } else {
        throw "OpenSSLコマンドが失敗しました"
    }
} catch {
    Write-Host ""
    Write-Host "エラー: OpenSSLが見つかりません。" -ForegroundColor Red
    Write-Host ""
    Write-Host "OpenSSLをインストールする方法:" -ForegroundColor Yellow
    Write-Host "1. Git for Windowsを使用している場合、Git Bashに含まれています"
    Write-Host "2. または、https://slproweb.com/products/Win32OpenSSL.html からインストール"
    Write-Host "3. または、Chocolateyを使用: choco install openssl"
    Write-Host ""
    Read-Host "Enterキーを押して終了"
}


