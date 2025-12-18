@echo off
echo ローカルサーバーを起動しています...
echo ブラウザで http://localhost:8080 を開いてください
echo 停止するには Ctrl+C を押してください
cd /d "%~dp0"
npx http-server -p 8080 -o

