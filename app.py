# -*- coding: utf-8 -*-
import streamlit as st
from supabase import create_client
import pandas as pd
from datetime import datetime
import re

# ========================================
# 接続情報
# ========================================
SUPABASE_URL = "https://uevlguozshzwywzqtsvr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldmxndW96c2h6d3l3enF3enF0c3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjkzMDcsImV4cCI6MjA3NDkwNTMwN30.hx82K_19c5Mmh9NXCCf15_yGDPLJ5O_XM_CnWuVMyZ8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ========================================
# ページ設定
# ========================================
st.set_page_config(
    page_title="データベース管理",
    layout="wide",
    page_icon="📊",
    initial_sidebar_state="expanded"
)

# ========================================
# CSSデザイン
# ========================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
* { font-family: 'Inter', sans-serif; }
.main { background-color: #f0f2f5; padding: 1.5rem; }
[data-testid="stSidebar"] { background: #2c5282; padding-top: 1rem; }
[data-testid="stSidebar"] * { color: white !important; }
[data-testid="stSidebar"] .stRadio > label { font-weight: 500; font-size: 15px; }
.info-card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.12); border-left: 4px solid #3182ce; }
.info-list-item { padding: 12px; margin: 8px 0; background: #f7fafc; border-radius: 6px; border-left: 3px solid #3182ce; font-size: 14px; }
.status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
</style>
""", unsafe_allow_html=True)

# ========================================
# データベース関数（修正版）
# ========================================

def get_available_tables():
    """Supabaseからpublicスキーマのテーブル名を取得"""
    try:
        resp = supabase.table("pg_catalog.pg_tables").select("*").execute()
        tables = [
            row["tablename"]
            for row in resp.data
            if row.get("schemaname") == "public" and not row["tablename"].startswith("pg_")
        ]
        return sorted(list(set(tables)))
    except Exception:
        # pg_catalogが読めない環境ではフォールバック
        try:
            candidates = ["t_machinecode", "users", "orders", "items"]
            valid = []
            for t in candidates:
                try:
                    supabase.table(t).select("*").limit(1).execute()
                    valid.append(t)
                except:
                    pass
            return valid
        except:
            return []


def get_table_columns(table_name):
    """テーブルのカラム一覧を取得"""
    try:
        response = supabase.table(table_name).select("*").limit(1).execute()
        if response.data and len(response.data) > 0:
            return list(response.data[0].keys())
        return []
    except:
        return []


def get_table_columns_with_types(table_name):
    """カラム名と推定型を返す（文字列型を検索対象にする用）"""
    try:
        resp = supabase.table("pg_catalog.pg_table_def").select("*").eq("tablename", table_name).execute()
        cols = []
        for r in resp.data:
            cols.append((r.get("column"), r.get("type")))
        return cols
    except:
        # fallback
        try:
            r = supabase.table(table_name).select("*").limit(1).execute()
            if r.data:
                row = r.data[0]
                return [(k, type(v).__name__) for k, v in row.items()]
        except:
            return []
    return []


def get_table_data(table_name, limit=1000):
    try:
        resp = supabase.table(table_name).select("*").limit(limit).execute()
        if resp.data:
            return pd.DataFrame(resp.data)
        return pd.DataFrame()
    except:
        return pd.DataFrame()


def get_table_count(table_name):
    try:
        resp = supabase.table(table_name).select("*", count="exact").execute()
        return resp.count if hasattr(resp, "count") else len(resp.data)
    except:
        return 0


# ========================================
# SQLビルダー用関数
# ========================================
def build_sql_query(config):
    sql_parts = []
    if config["select_fields"]:
        fields = ", ".join(
            [f"{f['table']}.{f['field']} AS {f['alias']}" if f.get("alias") else f"{f['table']}.{f['field']}" for f in config["select_fields"]]
        )
        sql_parts.append(f"SELECT {fields}")
    else:
        sql_parts.append("SELECT *")
    sql_parts.append(f"FROM {config['from_table']}")
    if config.get("where_conditions"):
        conds = []
        for cond in config["where_conditions"]:
            field = f"{cond['table']+'.' if cond.get('table') else ''}{cond['field']}"
            if cond["operator"] == "=":
                conds.append(f"{field} = '{cond['value']}'")
            elif cond["operator"] == "LIKE":
                conds.append(f"{field} LIKE '%{cond['value']}%'")
        if conds:
            sql_parts.append("WHERE " + " AND ".join(conds))
    if config.get("order_by"):
        sql_parts.append(f"ORDER BY {config['order_by']}")
    if config.get("limit"):
        sql_parts.append(f"LIMIT {config['limit']}")
    return "\n".join(sql_parts)


# ========================================
# サイドバー
# ========================================
with st.sidebar:
    st.markdown("# 📊 データベース管理")
    st.markdown("---")
    if st.button("🔄 テーブル再取得"):
        st.rerun()
    page = st.radio(
        "メニュー",
        ["🏠 ダッシュボード", "📋 データ管理", "🔍 検索", "📊 集計分析", "🔧 SQLビルダー"],
        label_visibility="collapsed",
    )
    st.markdown("---")
    available_tables = get_available_tables()
    if available_tables:
        selected_table = st.selectbox("テーブル選択", available_tables, label_visibility="collapsed")
    else:
        selected_table = None

# ========================================
# 🏠 ダッシュボード
# ========================================
if page == "🏠 ダッシュボード":
    st.markdown("## 📊 ダッシュボード")
    if available_tables:
        total_records = sum(get_table_count(t) for t in available_tables)
        st.metric("総レコード数", f"{total_records:,}")
        st.metric("テーブル数", len(available_tables))
        for t in available_tables:
            st.write(f"- {t}: {get_table_count(t)}件")
    else:
        st.warning("テーブルが見つかりません。")

# ========================================
# 📋 データ管理
# ========================================
elif page == "📋 データ管理":
    st.markdown("## 📋 データ管理")
    if not selected_table:
        st.warning("サイドバーでテーブルを選択してください")
        st.stop()

    tab1, tab2 = st.tabs(["📋 一覧", "➕ 追加"])
    with tab1:
        df = get_table_data(selected_table)
        if len(df) > 0:
            st.dataframe(df, use_container_width=True, hide_index=True)
        else:
            st.info("データがありません。")

    with tab2:
        cols = get_table_columns(selected_table)
        new_data = {}
        with st.form("add_record"):
            for c in cols:
                if c.lower() in ["id", "created_at", "updated_at"]:
                    continue
                new_data[c] = st.text_input(c)
            if st.form_submit_button("✅ 登録"):
                try:
                    supabase.table(selected_table).insert(new_data).execute()
                    st.success("追加しました")
                    st.rerun()
                except Exception as e:
                    st.error(e)

# ========================================
# 🔍 検索
# ========================================
elif page == "🔍 検索":
    st.markdown("## 🔍 検索")
    if not selected_table:
        st.warning("テーブルを選択してください")
        st.stop()

    tab1, tab2 = st.tabs(["🔍 簡単検索", "🎯 詳細検索"])

    with tab1:
        kw = st.text_input("検索キーワード")
        if st.button("検索"):
            if not kw:
                st.warning("キーワードを入力してください")
                st.stop()

            cols_types = get_table_columns_with_types(selected_table)
            search_cols = []
            for c, t in cols_types:
                if not t:
                    search_cols.append(c)
                    continue
                t = str(t).lower()
                if any(x in t for x in ["char", "text", "json", "uuid"]):
                    search_cols.append(c)

            results = []
            for c in search_cols:
                try:
                    r = supabase.table(selected_table).select("*").ilike(c, f"%{kw}%").limit(100).execute()
                    if r.data:
                        results.extend(r.data)
                except:
                    pass

            if results:
                df = pd.DataFrame(results).drop_duplicates()
                st.success(f"{len(df)}件ヒットしました")
                st.dataframe(df, use_container_width=True, hide_index=True)
            else:
                st.info("該当データがありません。")

    with tab2:
        st.info("複数条件検索機能（詳細検索）は今後拡張予定です。")

# ========================================
# 📊 集計分析
# ========================================
elif page == "📊 集計分析":
    st.markdown("## 📊 集計分析")
    if not selected_table:
        st.warning("テーブルを選択してください")
        st.stop()
    df = get_table_data(selected_table)
    if len(df) == 0:
        st.info("データがありません")
        st.stop()
    cols = get_table_columns(selected_table)
    group_col = st.selectbox("グループ化列", cols)
    calc_col = st.selectbox("集計対象", cols)
    method = st.selectbox("方法", ["件数", "合計", "平均"])
    if st.button("集計実行"):
        try:
            if method == "件数":
                result = df.groupby(group_col).size().reset_index(name="件数")
            elif method == "合計":
                result = df.groupby(group_col)[calc_col].sum().reset_index(name="合計")
            else:
                result = df.groupby(group_col)[calc_col].mean().reset_index(name="平均")
            st.dataframe(result, use_container_width=True, hide_index=True)
        except Exception as e:
            st.error(e)

# ========================================
# 🔧 SQLビルダー
# ========================================
elif page == "🔧 SQLビルダー":
    st.markdown("## 🔧 SQLビルダー")
    if "sql_config" not in st.session_state:
        st.session_state.sql_config = {
            "from_table": "",
            "select_fields": [],
            "where_conditions": [],
            "order_by": "",
            "limit": 100,
        }
    config = st.session_state.sql_config
    config["from_table"] = st.text_input("テーブル名", value=config["from_table"])
    field = st.text_input("フィールド名")
    if st.button("追加"):
        config["select_fields"].append({"table": config["from_table"], "field": field})
    sql = build_sql_query(config)
    st.code(sql, language="sql")
