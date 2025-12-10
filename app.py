   # データ管理アプリ - クラウド表示対応
# app.py
import streamlit as st
import os
import locale

# 日本語ロケール設定
try:
    locale.setlocale(locale.LC_ALL, 'ja_JP.UTF-8')
except:
    try:
        locale.setlocale(locale.LC_ALL, 'Japanese_Japan.932')
    except:
        pass  # システムのデフォルトロケールを使用

from modules import (
    supabase_utils,
    ui_dashboard,
    ui_manage,
)

st.set_page_config(
    page_title="データベース管理", 
    layout="wide", 
    page_icon="🚀",
    initial_sidebar_state="expanded"
)

# Load CSS
css_path = os.path.join(os.path.dirname(__file__), "style.css")
try:
    with open(css_path, "r", encoding="utf-8") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)
except Exception:
    pass

# ページヘッダー（装飾的な要素）
st.markdown("""
<div style="position: fixed; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%); z-index: 9999; animation: gradientShift 15s ease infinite;"></div>
""", unsafe_allow_html=True)

# Initialize supabase client (module handles secrets)
supabase = supabase_utils.get_client()

# Provide available_tables globally via module helper (cached)
available_tables = supabase_utils.get_available_tables()

# Sidebar navigation
with st.sidebar:
    st.markdown("""
    <div style="text-align: center; padding: 20px 0;">
        <div style="font-size: 48px; margin-bottom: 10px;">🚀</div>
        <h1 style="margin: 0;">データベース管理</h1>
    </div>
    """, unsafe_allow_html=True)
    st.markdown("---")

    if "page" not in st.session_state:
        st.session_state["page"] = "ダッシュボード"

    if st.button("🏠 ダッシュボード"):
        st.session_state["page"] = "ダッシュボード"
        st.rerun()
    if st.button("📋 データ管理"):
        st.session_state["page"] = "データ管理"
        st.rerun()

    st.markdown("---")
    if st.button("🔄 更新（キャッシュクリア）"):
        # キャッシュをクリアしてクラウドから最新データを取得
        st.cache_data.clear()
        st.success("✅ キャッシュをクリアしました。最新データを取得します。")
        st.rerun()

    st.markdown("### テーブル一覧")
    if available_tables:
        for t in available_tables:
            cnt = supabase_utils.get_table_count(t)
            st.caption(f"• {t} ({cnt:,} 件)")
    else:
        st.info("テーブルが見つかりません")

# Route to pages
page = st.session_state.get("page", "ダッシュボード")

if page == "ダッシュボード":
    ui_dashboard.show(supabase, available_tables)
elif page == "データ管理":
    ui_manage.show(supabase, available_tables)
else:
    st.write("不明なページ")
