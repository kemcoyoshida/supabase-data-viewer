@echo off
echo 自己署名証明書を生成しています...
echo.

if not exist "certs" mkdir certs

echo OpenSSLを使用して証明書を生成します...
echo.

openssl req -x509 -newkey rsa:2048 -keyout certs\key.pem -out certs\cert.pem -days 365 -nodes -subj "/C=JP/ST=Tokyo/L=Tokyo/O=Test/CN=localhost"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo 証明書の生成が完了しました！
    echo certs\key.pem と certs\cert.pem が作成されました。
) else (
    echo.
    echo エラー: OpenSSLが見つかりません。
    echo.
    echo OpenSSLをインストールする方法:
    echo 1. Git for Windowsを使用している場合、Git Bashに含まれています
    echo 2. または、https://slproweb.com/products/Win32OpenSSL.html からインストール
    echo 3. または、Chocolateyを使用: choco install openssl
    echo.
    pause
)


