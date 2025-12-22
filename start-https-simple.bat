@echo off
chcp 65001 >nul
echo ========================================
echo HTTPSサーバーを起動しています...
echo ========================================
echo.

REM スクリプトがあるディレクトリに移動
cd /d "%~dp0"

REM 現在のディレクトリを表示
echo 作業ディレクトリ: %CD%
echo.

echo 証明書を確認・生成中...
node generate-cert.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo エラー: 証明書の生成に失敗しました
    echo npm install を実行してください
    pause
    exit /b 1
)

echo.
echo サーバーを起動します...
echo.
echo ブラウザで https://localhost:5500 を開いてください
echo.
echo ⚠️  自己署名証明書を使用しています。
echo    ブラウザで警告が表示されたら「詳細設定」をクリックしてください
echo.
echo 停止するには Ctrl+C を押してください
echo.

node https-server.js

pause

