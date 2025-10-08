# -*- coding: utf-8 -*-
import streamlit as st
from supabase import create_client, Client
import pandas as pd
from datetime import datetime
import re

# ========================================
# 接続情報
# ========================================
SUPABASE_URL = "https://uevlguozshzwywzqtsvr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldmxndW96c2h6d3l3enF0c3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjkzMDcsImV4cCI6MjA3NDkwNTMwN30.hx82K_19c5Mmh9NXCCf15_yGDPLJ5O_XM_CnWuVMyZ8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ========================================
# ページ設定
# ========================================
st.set_page_config(
    page_title="データベース管理システム", 
    layout="wide", 
    page_icon="📊",
    initial_sidebar_state="expanded"
)

# 業務システム風CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
    
    * {
        font-family: 'Noto Sans JP', sans-serif;
    }
    
    .main {
        background-color: #e8e8e8;
        padding: 0;
    }
    
    /* ヘッダー */
    .system-header {
        background: linear-gradient(180deg, #4a5568 0%, #2d3748 100%);
        color: white;
        padding: 1rem 2rem;
        margin-bottom: 0;
        border-bottom: 3px solid #cbd5e0;
    }
    
    .system-title {
        font-size: 20px;
        font-weight: 700;
        margin: 0;
    }
    
    .system-subtitle {
        font-size: 12px;
        color: #cbd5e0;
        margin: 0;
    }
    
    /* サイドバー */
    [data-testid="stSidebar"] {
        background: #f7fafc;
        border-right: 2px solid #cbd5e0;
    }
    
    [data-testid="stSidebar"] * {
        color: #2d3748 !important;
    }
    
    [data-testid="stSidebar"] > div:first-child {
        padding: 1rem;
    }
    
    /* メニュー */
    .menu-section {
        background: #4a5568;
        color: white;
        padding: 0.75rem 1rem;
        margin: 0.5rem 0;
        font-weight: 700;
        font-size: 14px;
        border-left: 4px solid #cbd5e0;
    }
    
    [data-testid="stSidebar"] .stRadio > div > label {
        background: white;
        border: 1px solid #cbd5e0;
        border-left: 4px solid #cbd5e0;
        padding: 0.75rem 1rem;
        margin: 0.25rem 0;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
    }
    
    [data-testid="stSidebar"] .stRadio > div > label:hover {
        background: #edf2f7;
        border-left-color: #4a5568;
    }
    
    [data-testid="stSidebar"] .stRadio > div > label[data-checked="true"] {
        background: #4a5568;
        color: white !important;
        border-left-color: #2d3748;
    }
    
    /* コンテンツエリア */
    .content-wrapper {
        background: white;
        margin: 1rem;
        padding: 1.5rem;
        border: 1px solid #cbd5e0;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
    }
    
    /* テーブルヘッダー */
    .table-header {
        background: linear-gradient(180deg, #718096 0%, #4a5568 100%);
        color: white;
        padding: 0.75rem 1rem;
        font-weight: 700;
        font-size: 15px;
        border: 1px solid #4a5568;
        margin-bottom: 1rem;
    }
    
    /* データテーブル */
    .dataframe {
        border: 2px solid #4a5568 !important;
        font-size: 13px;
    }
    
    .dataframe thead th {
        background: #718096 !important;
        color: white !important;
        font-weight: 700 !important;
        border: 1px solid #4a5568 !important;
        padding: 0.75rem !important;
    }
    
    .dataframe tbody td {
        border: 1px solid #cbd5e0 !important;
        padding: 0.5rem !important;
    }
    
    .dataframe tbody tr:nth-child(even) {
        background: #f7fafc !important;
    }
    
    .dataframe tbody tr:hover {
        background: #edf2f7 !important;
    }
    
    /* ボタン */
    .stButton > button {
        background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e0 100%);
        color: #2d3748;
        border: 1px solid #a0aec0;
        border-radius: 3px;
        padding: 0.5rem 1.5rem;
        font-weight: 600;
        font-size: 13px;
        box-shadow: 1px 1px 3px rgba(0,0,0,0.2);
    }
    
    .stButton > button:hover {
        background: linear-gradient(180deg, #cbd5e0 0%, #a0aec0 100%);
        border-color: #718096;
    }
    
    .stButton > button:active {
        box-shadow: inset 1px 1px 3px rgba(0,0,0,0.3);
    }
    
    /* プライマリボタン */
    button[kind="primary"] {
        background: linear-gradient(180deg, #4299e1 0%, #3182ce 100%) !important;
        color: white !important;
        border: 1px solid #2c5282 !important;
    }
    
    button[kind="primary"]:hover {
        background: linear-gradient(180deg, #3182ce 0%, #2c5282 100%) !important;
    }
    
    /* メトリクス */
    [data-testid="stMetric"] {
        background: white;
        border: 2px solid #cbd5e0;
        padding: 1rem;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
    }
    
    [data-testid="stMetricLabel"] {
        font-size: 12px;
        font-weight: 700;
        color: #4a5568;
    }
    
    [data-testid="stMetricValue"] {
        font-size: 24px;
        font-weight: 700;
        color: #2d3748;
    }
    
    /* タブ */
    .stTabs [data-baseweb="tab-list"] {
        background: #e2e8f0;
        border-bottom: 2px solid #4a5568;
        gap: 0;
    }
    
    .stTabs [data-baseweb="tab"] {
        background: #cbd5e0;
        border: 1px solid #a0aec0;
        border-bottom: none;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        color: #2d3748;
        margin-right: 2px;
    }
    
    .stTabs [aria-selected="true"] {
        background: white;
        color: #2d3748;
        border-bottom: 2px solid white;
        position: relative;
        top: 2px;
    }
    
    /* インプット */
    .stTextInput input, .stSelectbox select, .stNumberInput input {
        border: 1px solid #cbd5e0 !important;
        border-radius: 3px !important;
        font-size: 13px !important;
    }
    
    /* 情報ボックス */
    .info-panel {
        background: #f7fafc;
        border: 2px solid #cbd5e0;
        border-left: 4px solid #4299e1;
        padding: 1rem;
        margin: 1rem 0;
    }
    
    .section-title {
        background: linear-gradient(180deg, #718096 0%, #4a5568 100%);
        color: white;
        padding: 0.5rem 1rem;
        font-weight: 700;
        font-size: 14px;
        margin: 1rem 0 0.5rem 0;
        border-left: 4px solid #2d3748;
    }
</style>
""", unsafe_allow_html=True)

# ========================================
# データベース関数
# ========================================
def get_available_tables():
    """テーブル一覧取得"""
    try:
        all_tables = set()
        
        prefixes = ['t_', 'T_', 'tbl_', 'table_', '']
        base_names = [
            'machinecode', 'machineunitcode', 'unitcode',
            'expense', 'acceptorder', 'order', 'sales', 'purchase',
            'product', 'customer', 'user', 'data', 'master'
        ]
        
        test_names = []
        for prefix in prefixes:
            for name in base_names:
                test_names.append(f"{prefix}{name}")
                test_names.append(f"{prefix}{name.capitalize()}")
        
        known_tables = ['t_machinecode', 't_machineunitcode', 'T_Expense', 'T_AcceptOrder']
        test_names.extend(known_tables)
        test_names = list(set(test_names))
        
        for table_name in test_names:
            try:
                response = supabase.table(table_name).select("*").limit(1).execute()
                all_tables.add(table_name)
            except:
                pass
        
        return sorted(list(all_tables)) if all_tables else []
    except:
        return []

def get_table_columns(table_name):
    """カラム一覧取得"""
    try:
        response = supabase.table(table_name).select("*").limit(1).execute()
        if response.data and len(response.data) > 0:
            return list(response.data[0].keys())
        return []
    except:
        return []

def get_table_data(table_name, limit=1000):
    """データ取得"""
    try:
        response = supabase.table(table_name).select("*").limit(limit).execute()
        if response.data:
            return pd.DataFrame(response.data)
        return pd.DataFrame()
    except:
        return pd.DataFrame()

def get_table_count(table_name):
    """件数取得"""
    try:
        response = supabase.table(table_name).select("*", count="exact").execute()
        return response.count if hasattr(response, 'count') else len(response.data)
    except:
        return 0

# ========================================
# ヘッダー
# ========================================
st.markdown("""
<div class="system-header">
    <div class="system-title">📊 データベース管理システム</div>
    <div class="system-subtitle">Database Management System - Ver 1.0</div>
</div>
""", unsafe_allow_html=True)

# ========================================
# サイドバー
# ========================================
with st.sidebar:
    st.markdown('<div class="menu-section">▼ メインメニュー</div>', unsafe_allow_html=True)
    
    page = st.radio(
        "メニュー",
        ["ホーム", "データ一覧/検索", "データ登録", "データ更新", "データ削除", "集計・分析", "SQLクエリ"],
        label_visibility="collapsed"
    )
    
    st.markdown("---")
    st.markdown('<div class="menu-section">▼ テーブル管理</div>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        if st.button("更新", use_container_width=True):
            st.cache_data.clear()
            st.rerun()
    with col2:
        if st.button("再検索", use_container_width=True):
            st.cache_data.clear()
            st.rerun()
    
    available_tables = get_available_tables()
    
    if available_tables:
        st.success(f"✓ {len(available_tables)}テーブル検出")
        selected_table = st.selectbox("テーブル選択", available_tables, label_visibility="collapsed")
    else:
        st.warning("テーブルなし")
        selected_table = None
    
    st.markdown("---")
    st.caption(f"最終更新: {datetime.now().strftime('%Y/%m/%d %H:%M')}")

# ========================================
# メインコンテンツ
# ========================================

if page == "ホーム":
    st.markdown('<div class="table-header">■ システム概要</div>', unsafe_allow_html=True)
    
    if available_tables:
        cols = st.columns(3)
        total_records = sum([get_table_count(t) for t in available_tables])
        
        with cols[0]:
            st.metric("総レコード数", f"{total_records:,}")
        with cols[1]:
            st.metric("テーブル数", len(available_tables))
        with cols[2]:
            st.metric("最終更新", datetime.now().strftime("%Y/%m/%d"))
        
        st.markdown('<div class="section-title">■ テーブル一覧</div>', unsafe_allow_html=True)
        
        for table in available_tables:
            with st.container():
                st.markdown(f'<div class="info-panel"><strong>📋 {table}</strong> ({get_table_count(table):,}件)</div>', unsafe_allow_html=True)
                
                df = get_table_data(table, 5)
                if df is not None and len(df) > 0:
                    st.dataframe(df, use_container_width=True, hide_index=True)
    else:
        st.info("テーブルが登録されていません")

elif page == "データ一覧/検索":
    if not selected_table:
        st.warning("テーブルを選択してください")
        st.stop()
    
    st.markdown(f'<div class="table-header">■ {selected_table} - データ一覧/検索</div>', unsafe_allow_html=True)
    
    tab1, tab2 = st.tabs(["データ一覧", "条件検索"])
    
    with tab1:
        limit = st.slider("表示件数", 10, 1000, 100)
        df = get_table_data(selected_table, limit)
        
        if df is not None and len(df) > 0:
            st.info(f"📊 {len(df):,}件のデータを表示")
            st.dataframe(df, use_container_width=True, height=500, hide_index=True)
            
            csv = df.to_csv(index=False, encoding='shift_jis')
            st.download_button("CSVエクスポート", csv, f"{selected_table}.csv", "text/csv")
    
    with tab2:
        columns = [c for c in get_table_columns(selected_table) if c not in ['id', 'created_at', 'updated_at']]
        
        col1, col2, col3 = st.columns(3)
        with col1:
            search_col = st.selectbox("検索項目", columns)
        with col2:
            search_op = st.selectbox("条件", ["完全一致", "部分一致"])
        with col3:
            search_val = st.text_input("検索値")
        
        if st.button("検索実行", type="primary"):
            if search_val:
                query = supabase.table(selected_table).select("*")
                if search_op == "完全一致":
                    query = query.eq(search_col, search_val)
                else:
                    query = query.ilike(search_col, f"%{search_val}%")
                
                response = query.limit(500).execute()
                if response.data:
                    df = pd.DataFrame(response.data)
                    st.success(f"✓ {len(df)}件検索")
                    st.dataframe(df, use_container_width=True, hide_index=True)

elif page == "データ登録":
    if not selected_table:
        st.warning("テーブルを選択してください")
        st.stop()
    
    st.markdown(f'<div class="table-header">■ {selected_table} - 新規データ登録</div>', unsafe_allow_html=True)
    
    columns = get_table_columns(selected_table)
    
    with st.form("add_form", clear_on_submit=True):
        new_data = {}
        
        for col in columns:
            if col.lower() in ['id', 'created_at', 'updated_at']:
                continue
            
            if 'date' in col.lower():
                new_data[col] = st.date_input(col)
            else:
                new_data[col] = st.text_input(col)
        
        if st.form_submit_button("登録", type="primary", use_container_width=True):
            filtered = {k: v for k, v in new_data.items() if v}
            if filtered:
                try:
                    supabase.table(selected_table).insert(filtered).execute()
                    st.success("✓ 登録しました")
                    st.rerun()
                except Exception as e:
                    st.error(f"エラー: {e}")

elif page == "データ更新":
    if not selected_table:
        st.warning("テーブルを選択してください")
        st.stop()
    
    st.markdown(f'<div class="table-header">■ {selected_table} - データ更新</div>', unsafe_allow_html=True)
    
    df = get_table_data(selected_table, 100)
    if df is not None and len(df) > 0:
        st.dataframe(df, use_container_width=True, height=250, hide_index=True)
        
        id_col = 'id' if 'id' in df.columns else df.columns[0]
        selected_id = st.selectbox("更新するID", df[id_col].tolist())
        row = df[df[id_col] == selected_id].iloc[0]
        
        with st.form("edit_form"):
            updated = {}
            for col in df.columns:
                if col.lower() in ['id', 'created_at', 'updated_at']:
                    continue
                val = row[col]
                updated[col] = st.text_input(col, value=str(val) if not pd.isna(val) else "")
            
            if st.form_submit_button("更新", type="primary", use_container_width=True):
                try:
                    supabase.table(selected_table).update(updated).eq(id_col, selected_id).execute()
                    st.success("✓ 更新しました")
                    st.rerun()
                except Exception as e:
                    st.error(f"エラー: {e}")

elif page == "データ削除":
    if not selected_table:
        st.warning("テーブルを選択してください")
        st.stop()
    
    st.markdown(f'<div class="table-header">■ {selected_table} - データ削除</div>', unsafe_allow_html=True)
    st.error("⚠ 削除したデータは復元できません")
    
    df = get_table_data(selected_table, 100)
    if df is not None and len(df) > 0:
        st.dataframe(df, use_container_width=True, height=250, hide_index=True)
        
        id_col = 'id' if 'id' in df.columns else df.columns[0]
        selected_id = st.selectbox("削除するID", df[id_col].tolist())
        
        if st.button("削除実行", type="primary"):
            try:
                supabase.table(selected_table).delete().eq(id_col, selected_id).execute()
                st.success("✓ 削除しました")
                st.rerun()
            except Exception as e:
                st.error(f"エラー: {e}")

elif page == "集計・分析":
    if not selected_table:
        st.warning("テーブルを選択してください")
        st.stop()
    
    st.markdown(f'<div class="table-header">■ {selected_table} - 集計・分析</div>', unsafe_allow_html=True)
    
    columns = [c for c in get_table_columns(selected_table) if c not in ['id', 'created_at', 'updated_at']]
    
    group_cols = st.multiselect("グループ化項目", columns)
    calc_type = st.selectbox("集計方法", ["件数", "合計", "平均", "最大値", "最小値"])
    
    if calc_type != "件数":
        calc_col = st.selectbox("集計項目", columns)
    
    if st.button("集計実行", type="primary"):
        if group_cols:
            df = get_table_data(selected_table, 10000)
            if df is not None and len(df) > 0:
                if calc_type == "件数":
                    result = df.groupby(group_cols).size().reset_index(name='件数')
                else:
                    df[calc_col] = pd.to_numeric(df[calc_col], errors='coerce')
                    if calc_type == "合計":
                        result = df.groupby(group_cols)[calc_col].sum().reset_index()
                    elif calc_type == "平均":
                        result = df.groupby(group_cols)[calc_col].mean().reset_index()
                    elif calc_type == "最大値":
                        result = df.groupby(group_cols)[calc_col].max().reset_index()
                    else:
                        result = df.groupby(group_cols)[calc_col].min().reset_index()
                
                st.success(f"✓ {len(result)}グループ")
                st.dataframe(result, use_container_width=True, hide_index=True)

elif page == "SQLクエリ":
    st.markdown('<div class="table-header">■ SQLクエリビルダー</div>', unsafe_allow_html=True)
    st.info("現在開発中の機能です")
