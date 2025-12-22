@echo off
echo ========================================
echo HTTPSサーバーを起動しています...
echo ========================================
echo.
echo ブラウザで https://localhost:5500 を開いてください
echo.
echo ⚠️  自己署名証明書を使用しています。
echo    ブラウザで「詳細設定」→「続行」をクリックしてください。
echo.
echo 停止するには Ctrl+C を押してください
echo.
cd /d "%~dp0"
node https-server.js


