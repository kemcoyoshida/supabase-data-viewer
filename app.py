# -*- coding: utf-8 -*-
import streamlit as st
from supabase import create_client
import pandas as pd
from datetime import datetime

# ========================================
# Supabase 接続情報
# ========================================
SUPABASE_URL = "https://uevlguozshzwywzqtsvr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldmxndW96c2h6d3l3enF0c3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjkzMDcsImV4cCI6MjA3NDkwNTMwN30.hx82K_19c5Mmh9NXCCf15_yGDPLJ5O_XM_CnWuVMyZ8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ========================================
# ページ設定（Streamlit公式テーマ適用）
# ========================================
st.set_page_config(
    page_title="データベース管理",
    layout="wide",
    page_icon="📁",
    initial_sidebar_state="expanded",
)

# ========================================
# 🌿 ナチュラルモダンテーマ（全体配色）
# ========================================
st.markdown("""
    <style>
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
        background-color: #f8f7f4 !important;
        color: #3e3b35;
    }

    /* サイドバー */
    section[data-testid="stSidebar"] {
        background: linear-gradient(180deg, #6b665c 0%, #4a4741 100%);
        color: #f4f3ef !important;
    }

    section[data-testid="stSidebar"] div[role="radiogroup"] label {
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        margin-bottom: 4px;
        padding: 6px 10px;
        font-weight: 500;
        color: #f4f3ef !important;
    }
    section[data-testid="stSidebar"] div[role="radiogroup"] label:hover {
        background: rgba(255,255,255,0.2);
    }

    /* ボタン */
    div.stButton > button {
        background: linear-gradient(135deg, #c5a880 0%, #b8926a 100%) !important;
        color: white !important;
        border-radius: 8px !important;
        border: none !important;
        height: 42px;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    div.stButton > button:hover {
        background: linear-gradient(135deg, #b8926a 0%, #a87f50 100%) !important;
        box-shadow: 0 4px 12px rgba(185, 146, 106, 0.5);
        transform: translateY(-2px);
    }

    /* タイトル */
    .page-title {
        font-size: 32px;
        font-weight: 800;
        color: #3e3b35;
        margin-bottom: 0.25rem;
    }
    .page-subtitle {
        font-size: 15px;
        color: #7c7a74;
        margin-bottom: 1.5rem;
    }

    /* カード */
    .info-card {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        border-left: 6px solid #b8926a;
    }

    /* テーブル */
    .dataframe {
        border-radius: 10px;
        background: #fffaf0;
        border: 1px solid #d9d4c7;
    }

    /* メトリクス */
    [data-testid="stMetric"] {
        background: #fff;
        border-radius: 10px;
        padding: 1rem;
        box-shadow: 0 1px 6px rgba(0,0,0,0.05);
    }
    [data-testid="stMetricValue"] {
        color: #6b5d4f;
    }

    /* エクスパンダー */
    .streamlit-expanderHeader {
        background: #f4f3ef !important;
        border: 1px solid #ddd !important;
        border-radius: 10px;
        font-weight: 600;
    }
    </style>
""", unsafe_allow_html=True)

# ========================================
# データベース関数
# ========================================
def get_available_tables():
    try:
        res = supabase.table("pg_catalog.pg_tables").select("tablename").execute()
        return [r["tablename"] for r in res.data if not r["tablename"].startswith("pg_")]
    except Exception:
        return []

def get_table_data(table_name, limit=1000):
    try:
        res = supabase.table(table_name).select("*").limit(limit).execute()
        return pd.DataFrame(res.data)
    except:
        return pd.DataFrame()

def get_table_columns(table_name):
    try:
        res = supabase.table(table_name).select("*").limit(1).execute()
        return list(res.data[0].keys()) if res.data else []
    except:
        return []

# ========================================
# サイドバー
# ========================================
with st.sidebar:
    st.markdown("## 📁 データベース管理")
    page = st.radio("メニュー", ["🏠 ダッシュボード", "📋 データ管理", "🔍 検索"], label_visibility="collapsed")
    st.markdown("---")
    tables = get_available_tables()
    if not tables:
        st.warning("テーブルがありません")
        st.stop()
    selected = st.selectbox("テーブルを選択", tables, label_visibility="collapsed")

# ========================================
# ページ切り替え
# ========================================

# 🏠 ダッシュボード
if page == "🏠 ダッシュボード":
    st.markdown('<div class="page-title">🏠 ダッシュボード</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-subtitle">テーブル概要を表示します。</div>', unsafe_allow_html=True)
    total_records = 0
    for t in tables:
        df = get_table_data(t, 100)
        total_records += len(df)
    c1, c2 = st.columns(2)
    c1.metric("テーブル数", len(tables))
    c2.metric("総レコード数", total_records)

    st.markdown("### 📊 最近のデータプレビュー")
    for t in tables:
        df = get_table_data(t, 5)
        if not df.empty:
            st.markdown(f"**{t}**")
            st.dataframe(df, use_container_width=True, hide_index=True)

# 📋 データ管理
elif page == "📋 データ管理":
    st.markdown(f'<div class="page-title">📋 {selected}</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-subtitle">データの表示と追加</div>', unsafe_allow_html=True)
    tab1, tab2 = st.tabs(["📄 一覧", "➕ 追加"])

    with tab1:
        df = get_table_data(selected)
        if not df.empty:
            st.dataframe(df, use_container_width=True, hide_index=True, height=500)
        else:
            st.info("データがありません。")

    with tab2:
        cols = get_table_columns(selected)
        with st.form("add_form", clear_on_submit=True):
            record = {}
            for col in cols:
                if col.lower() in ["id", "created_at", "updated_at"]:
                    continue
                record[col] = st.text_input(col)
            if st.form_submit_button("登録"):
                try:
                    supabase.table(selected).insert(record).execute()
                    st.success("登録しました。")
                    st.rerun()
                except Exception as e:
                    st.error(str(e))

# 🔍 検索
elif page == "🔍 検索":
    st.markdown('<div class="page-title">🔍 検索</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-subtitle">キーワードで検索します。</div>', unsafe_allow_html=True)

    keyword = st.text_input("キーワードを入力してください")
    if st.button("検索"):
        if not keyword:
            st.warning("キーワードを入力してください。")
        else:
            cols = get_table_columns(selected)
            results = []
            for col in cols:
                try:
                    res = supabase.table(selected).select("*").ilike(col, f"%{keyword}%").execute()
                    if res.data:
                        results.extend(res.data)
                except:
                    pass
            if results:
                df = pd.DataFrame(results).drop_duplicates()
                st.success(f"{len(df)} 件ヒットしました。")
                st.dataframe(df, use_container_width=True, hide_index=True)
            else:
                st.warning("一致するデータがありません。")
