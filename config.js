// Supabase接続設定
// ⚠️ 注意: 本番環境では環境変数や別ファイルで管理することを推奨します
const SUPABASE_CONFIG = {
    url: "https://uevlguozshzwywzqtsvr.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldmxndW96c2h6d3l3enF0c3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjkzMDcsImV4cCI6MjA3NDkwNTMwN30.hx82K_19c5Mmh9NXCCf15_yGDPLJ5O_XM_CnWuVMyZ8"
};

// 管理者パスワード設定
// ⚠️ 本番環境では必ず変更してください
const ADMIN_PASSWORD = "admin123";

// 外部リンク設定（初期値）
// 管理者モードで編集可能になります
const DEFAULT_EXTERNAL_LINKS = [];

// 採番システムAPI設定
// FastAPIバックエンドのベースURL
window.SAIBAN_API_BASE_URL = window.SAIBAN_API_BASE_URL || 'http://localhost:8000';


// FastAPIバックエンドのベースURL
window.SAIBAN_API_BASE_URL = window.SAIBAN_API_BASE_URL || 'http://localhost:8000';

