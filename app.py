# app.py
# -*- coding: utf-8 -*-
import streamlit as st
from modules import (
    supabase_utils,
    ui_dashboard,
    ui_manage,
    ui_create,
    ui_search,
)
import os

st.set_page_config(page_title="データベース管理", layout="wide", page_icon="🟤")

# Load CSS
css_path = os.path.join(os.path.dirname(__file__), "style.css")
try:
    with open(css_path, "r", encoding="utf-8") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)
except Exception:
    pass

# Initialize supabase client (module handles secrets)
supabase = supabase_utils.get_client()

# Provide available_tables globally via module helper (cached)
available_tables = supabase_utils.get_available_tables()

# Sidebar navigation
with st.sidebar:
    st.markdown("# 🟤 データベース管理")
    st.markdown("---")

    if "page" not in st.session_state:
        st.session_state["page"] = "ダッシュボード"

    if st.button("🏠 ダッシュボード"):
        st.session_state["page"] = "ダッシュボード"
        st.rerun()
    if st.button("📋 データ管理"):
        st.session_state["page"] = "データ管理"
        st.rerun()
    if st.button("🆕 テーブル作成"):
        st.session_state["page"] = "テーブル作成"
        st.rerun()
    if st.button("🔍 詳細検索"):
        st.session_state["page"] = "詳細検索"
        st.rerun()

    st.markdown("---")
    if st.button("🔄 更新"):
        st.cache_data.clear()
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
elif page == "テーブル作成":
    ui_create.show(supabase, available_tables)
elif page == "データ管理":
    ui_manage.show(supabase, available_tables)
elif page == "詳細検索":
    ui_search.show(supabase, available_tables)
else:
    st.write("不明なページ")
