@echo off
echo ローカルサーバーを起動しています...
echo ブラウザで http://localhost:5500 を開いてください
echo 停止するには Ctrl+C を押してください
cd /d "%~dp0"
npx live-server --port=5500 --open=/index.html

