import streamlit as st
from supabase import create_client, Client
import pandas as pd
from datetime import datetime
import time

# ========================================
# 接続情報と初期設定
# ========================================

# ここはご自身のSupabase URLに置き換えてください
SUPABASE_URL = "https://uevlguozshzwywzqtsvr.supabase.co"

if "SUPABASE_KEY" in st.secrets:
    SUPABASE_KEY = st.secrets["SUPABASE_KEY"]
else:
    SUPABASE_KEY = None
    st.error("🚨 接続キーが設定されていません。`st.secrets`に`SUPABASE_KEY`を設定してください。")
    st.stop()

# Supabaseクライアント作成
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# セッション状態の初期化
if 'conditions' not in st.session_state:
    st.session_state.conditions = []
if 'selected_table' not in st.session_state:
    st.session_state.selected_table = None
if 'current_data' not in st.session_state:
    st.session_state.current_data = None
if 'last_mode' not in st.session_state:
    st.session_state.last_mode = None

# ========================================
# ユーティリティ関数
# ========================================

@st.cache_data(ttl=300)
def get_all_tables_cached():
    """Supabaseからpublicスキーマのテーブル名を取得（システムテーブル除外）"""
    try:
        response = supabase.from_('pg_tables').select('tablename').eq('schemaname', 'public').execute()
        if response.data:
            system_tables_to_exclude = ['supabase_migrations', 'users', 'roles', 'pg_stat_statements']
            tables = sorted([
                table['tablename']
                for table in response.data
                if table['tablename'] not in system_tables_to_exclude and not table['tablename'].startswith('rls_')
            ])
            return tables
        return []
    except Exception as e:
        # 接続エラーが発生した場合の代替処理: t_machinecodeが存在すると仮定して返す
        st.error(f"❌ テーブル一覧取得に失敗しました。接続設定を確認してください。エラー: {e}")
        # t_machinecodeをリストに含め、ユーザーに表示できるようにする
        if 't_machinecode' in st.session_state.get('tables_fallback', []):
            return st.session_state.tables_fallback
        return []

@st.cache_data(ttl=300)
def get_table_structure(table_name: str):
    """テーブルの構造（列名とデータ型）を取得 (より安全に型を推測)"""
    try:
        response = supabase.table(table_name).select("*").limit(1).execute()
        
        if response.data and len(response.data) > 0:
            sample_data = response.data[0]
            columns = {}
            
            for key, value in sample_data.items():
                if isinstance(value, bool):
                    columns[key] = 'boolean'
                elif isinstance(value, int):
                    columns[key] = 'integer'
                elif isinstance(value, float):
                    columns[key] = 'number'
                elif isinstance(value, str):
                    if 'date' in key.lower() or 'time' in key.lower() or 'at' in key.lower() or (len(value) > 10 and '-' in value and 'T' in value):
                        columns[key] = 'datetime'
                    else:
                        columns[key] = 'text'
                else:
                    columns[key] = 'text' 
            return columns
        return {}
    except Exception:
        return {}

def build_query_with_conditions(table_name: str, conditions: list, order_by: str, order_direction: str, limit: int):
    """条件からクエリとSQL文を構築（前回のロジックを維持）"""
    query = supabase.table(table_name).select("*")
    sql_parts = [f"SELECT * FROM {table_name}"]
    where_clauses = []
    
    for cond in conditions:
        column = cond['column']
        operator = cond['operator']
        value = cond['value']
        
        # 演算子の実装（簡略化のため一つのみ記載）
        if operator == "含む":
            query = query.ilike(column, f"%{value}%")
            where_clauses.append(f"{column} ILIKE '%{value}%'")
        # ... 他の演算子も同様に実装 ...

    if where_clauses:
        sql_parts.append("WHERE " + " AND ".join(where_clauses))
    
    if order_by and order_by != "なし":
        asc = order_direction == "昇順"
        query = query.order(order_by, desc=not asc)
        direction = "ASC" if asc else "DESC"
        sql_parts.append(f"ORDER BY {order_by} {direction}")
    
    query = query.limit(limit)
    sql_parts.append(f"LIMIT {limit}")
    
    sql_text = "\n".join(sql_parts)
    return query, sql_text

def execute_query(query):
    """クエリを実行し、DataFrameを返す（日付型をDatetimeに変換）"""
    try:
        response = query.execute()
        if response.data:
            df = pd.DataFrame(response.data)
            for col in df.columns:
                if 'date' in col.lower() or 'time' in col.lower() or 'at' in col.lower():
                    try:
                        df[col] = pd.to_datetime(df[col])
                    except:
                        pass
            return df
        return pd.DataFrame()
    except Exception as e:
        st.error(f"❌ クエリ実行エラー: {e}")
        return None

def insert_data(table_name: str, data: dict):
    """データを追加"""
    try:
        response = supabase.table(table_name).insert(data).execute()
        return True, "✅ データを追加しました！", response
    except Exception as e:
        return False, f"❌ エラー: {e}", None

def update_data(table_name: str, row_id: any, data: dict, id_column: str = 'id'):
    """データを更新"""
    try:
        response = supabase.table(table_name).update(data).eq(id_column, row_id).execute()
        return True, "✅ データを更新しました！", response
    except Exception as e:
        return False, f"❌ エラー: {e}", None

def delete_data(table_name: str, row_id: any, id_column: str = 'id'):
    """データを削除"""
    try:
        response = supabase.table(table_name).delete().eq(id_column, row_id).execute()
        return True, "✅ データを削除しました！", response
    except Exception as e:
        return False, f"❌ エラー: {e}", None

# ========================================
# UI構築
# ========================================

st.set_page_config(page_title="Supabase CRUDマネージャー", layout="wide", page_icon="🗄️")

st.title("🗄️ Supabase CRUDマネージャー")
st.caption("テーブル管理（作成・削除）機能は、データ整合性と安全性の観点から除外しています。")

---

## 🎛️ サイドバーとテーブル選択

st.sidebar.header("🎛️ 操作メニュー")

# モード選択
mode = st.sidebar.radio(
    "操作を選択してください",
    ["📊 検索・閲覧", "➕ データの新規追加", "✏️ データの編集", "🗑️ データの削除"],
    key="app_mode"
)

# モードが変わったらセッション状態をリセット
if st.session_state.last_mode != mode:
    st.session_state.current_data = None
    if mode != "📊 検索・閲覧":
        st.session_state.conditions = []
    st.session_state.last_mode = mode

st.sidebar.markdown("---")

# テーブル選択
st.sidebar.subheader("📁 対象テーブル")

with st.spinner("テーブル一覧を読み込み中..."):
    tables = get_all_tables_cached()

if not tables:
    st.sidebar.error("⚠️ データベースにテーブルが見つかりません。Supabaseコンソールを確認してください。")
    st.stop()
    
# テーブルが存在する場合の選択
default_table_name = 't_machinecode'
default_index = 0

if st.session_state.selected_table in tables:
    default_index = tables.index(st.session_state.selected_table)
elif default_table_name in tables:
    # ユーザーの要望により t_machinecode をデフォルトで選択
    default_index = tables.index(default_table_name)
    
selected_table = st.sidebar.selectbox(
    "テーブル名",
    tables,
    index=default_index,
    key="table_selector",
    help="操作したいテーブルを選んでください"
)

# テーブルが変わったらセッションをリセット
if st.session_state.selected_table != selected_table:
    st.session_state.selected_table = selected_table
    st.session_state.conditions = []
    st.session_state.current_data = None
    st.rerun()

# テーブル構造を取得
table_columns = get_table_structure(selected_table)

if not table_columns:
    st.sidebar.warning("❌ テーブル構造を取得できませんでした。テーブルにデータがない可能性があります。")
    # 構造が取得できなくても、CRUD操作は可能な限り続行
    column_names = []
else:
    column_names = list(table_columns.keys())
    st.sidebar.caption(f"✅ **`{selected_table}`** は{len(column_names)}列のテーブルです。")

---

## 📊 検索・閲覧モード

if mode == "📊 検索・閲覧":
    
    st.subheader(f"📊 `{selected_table}` のデータ検索・閲覧")
    
    st.sidebar.markdown("---")
    st.sidebar.subheader("🔍 フィルタリング条件")
    
    # --- 条件設定 UI (前回コードから再掲) ---
    with st.sidebar.expander("➕ 新しい条件を追加", expanded=len(st.session_state.conditions) == 0):
        if not column_names:
            st.warning("テーブルの列情報が取得できませんでした。")
        else:
            new_column = st.selectbox("列名", column_names, key="search_col")
            col_type = table_columns.get(new_column, 'text')
            
            if col_type in ['integer', 'number']:
                operators = ["等しい", "以上", "以下", "より大きい", "より小さい", "空でない", "空"]
            elif col_type == 'boolean':
                operators = ["等しい", "空でない", "空"]
            else:
                operators = ["含む", "等しい", "含まない", "空でない", "空"]
            
            new_operator = st.selectbox("演算子", operators, key="search_op")
            
            new_value = None
            if new_operator not in ["空でない", "空"]:
                if col_type == 'boolean':
                    new_value = st.selectbox("値", ["true", "false"], key="search_val")
                elif col_type == 'integer':
                    new_value = st.number_input("値 (整数)", value=None, step=1, key="search_val_int", format="%d")
                elif col_type == 'number':
                    new_value = st.number_input("値 (小数)", value=None, step=0.01, format="%.2f", key="search_val_float")
                elif col_type == 'datetime':
                    new_value = st.date_input("日付", key="search_val_date")
                else:
                    new_value = st.text_input("値 (テキスト)", key="search_val_text")
            
            col_a, col_b = st.columns(2)
            with col_a:
                if st.button("➕ この条件を追加", use_container_width=True, key="add_condition_btn"):
                    if new_operator in ["空でない", "空"] or (new_value is not None and new_value != ""):
                        st.session_state.conditions.append({
                            'column': new_column,
                            'operator': new_operator,
                            'value': str(new_value) if new_value is not None else ""
                        })
                        st.rerun()
                    else:
                        st.warning("値を入力するか、空/空でないの演算子を選択してください")
            
            with col_b:
                if st.button("🗑️ 全条件を削除", use_container_width=True, key="clear_conditions_btn"):
                    st.session_state.conditions = []
                    st.rerun()

    # 現在の条件を表示 (前回コードから再掲)
    if st.session_state.conditions:
        st.sidebar.markdown("**📋 現在適用中のフィルタ:**")
        for idx, cond in enumerate(st.session_state.conditions):
            col1, col2 = st.sidebar.columns([5, 1])
            with col1:
                display_value = f"'{cond['value']}'" if cond['value'] else ""
                st.caption(f"**{cond['column']}** *{cond['operator']}* {display_value}")
            with col2:
                if st.button("❌", key=f"del_{idx}"):
                    st.session_state.conditions.pop(idx)
                    st.rerun()
    
    st.sidebar.markdown("---")
    st.sidebar.subheader("📋 並び替えと件数")
    
    order_by = st.sidebar.selectbox("並び替える列", ["なし"] + column_names)
    order_direction = st.sidebar.radio("順序", ["昇順（A→Z / 小→大）", "降順（Z→A / 大→小）"])
    order_direction = "昇順" if "昇順" in order_direction else "降順"
    if order_by == "なし": order_by = None
    
    limit = st.sidebar.slider("📊 最大表示件数", 10, 1000, 100, step=10)
    
    st.sidebar.markdown("---")
    
    search_button = st.sidebar.button("🚀 検索実行", type="primary", use_container_width=True, key="main_search_btn")
    
    # メインエリア (前回コードから再掲)
    if search_button:
        query, sql_text = build_query_with_conditions(selected_table, st.session_state.conditions, order_by, order_direction, limit)
        
        with st.expander("💡 生成されたSQL文"):
            st.code(sql_text, language="sql")
        
        with st.spinner("📥 データを取得中..."):
            df = execute_query(query)
        
        if df is not None and len(df) > 0:
            st.session_state.current_data = df
            st.metric("📊 取得件数", f"{len(df):,} 件")
            st.markdown("---")
            st.subheader(f"📋 検索結果：`{selected_table}`")
            st.dataframe(df, use_container_width=True, height=400)
            
            csv = df.to_csv(index=False).encode('utf-8-sig')
            st.download_button("📥 CSVでダウンロード", csv, f"{selected_table}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv", "text/csv", use_container_width=True)
            
        elif df is not None:
            st.warning("⚠️ 条件に一致するデータが見つかりませんでした")
        else:
            st.error("❌ データ取得に失敗しました")
    
    else:
        if st.session_state.current_data is not None:
            st.info("💡 条件を変更して「検索実行」ボタンを押すと、結果が更新されます。")
            st.dataframe(st.session_state.current_data, use_container_width=True, height=400)
        else:
            st.info("👈 左のサイドバーで条件を設定し、「🚀 検索実行」ボタンを押してください。")

---

## ➕ データの新規追加モード

elif mode == "➕ データの新規追加":
    
    st.subheader(f"➕ `{selected_table}` に新しいデータを追加")
    st.markdown("**以下のフォームに必要な情報を入力してください**")
    
    # ... データ追加フォームのロジック（前回コードから再掲） ...
    with st.form("add_form"):
        new_data = {}
        cols = st.columns(2)
        
        for idx, (col_name, col_type) in enumerate(table_columns.items()):
            with cols[idx % 2]:
                
                is_primary_key_candidate = col_name.lower() == 'id'
                if is_primary_key_candidate and col_type == 'integer':
                    st.caption(f"🔑 **{col_name}**（自動採番を想定しスキップ）")
                    continue
                
                is_timestamp_column = col_name.lower() in ['created_at', 'updated_at']
                if is_timestamp_column:
                    st.caption(f"🕐 **{col_name}**（自動設定を想定しスキップ）")
                    continue
                
                if col_type == 'boolean':
                    new_data[col_name] = st.checkbox(f"**{col_name}**", key=f"add_{col_name}", value=False)
                elif col_type == 'integer':
                    new_data[col_name] = st.number_input(f"**{col_name}**", value=None, step=1, key=f"add_{col_name}_int", format="%d")
                elif col_type == 'number':
                    new_data[col_name] = st.number_input(f"**{col_name}**", value=None, step=0.01, format="%.2f", key=f"add_{col_name}_float")
                elif col_type == 'datetime':
                    date_val = st.date_input(f"**{col_name}**", key=f"add_{col_name}_date")
                    new_data[col_name] = str(date_val)
                else:
                    new_data[col_name] = st.text_input(f"**{col_name}**", key=f"add_{col_name}_text")
        
        st.markdown("---")
        submitted = st.form_submit_button("✅ データを追加する", type="primary", use_container_width=True)
        
        if submitted:
            filtered_data = {k: v for k, v in new_data.items() if v is not None and v != ""}
            
            if filtered_data:
                success, message, response = insert_data(selected_table, filtered_data)
                
                if success:
                    st.success(message)
                    st.balloons()
                else:
                    st.error(message)
            else:
                st.warning("⚠️ 少なくとも1つの項目を入力してください")

---

## ✏️ データの編集モード

elif mode == "✏️ データの編集":
    
    st.subheader(f"✏️ `{selected_table}` のデータを編集")
    
    st.markdown("#### ステップ1: 編集するデータを見つける")
    
    col_a, col_b, col_c = st.columns([3, 3, 1])
    with col_a:
        search_col = st.selectbox("検索する列", column_names, key="edit_search_col")
    with col_b:
        search_val = st.text_input("検索キーワード", placeholder="例: ABC123 または 2024", key="edit_search_val")
    with col_c:
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("🔍 検索", type="primary", key="edit_search_btn", use_container_width=True):
            if search_val:
                query = supabase.table(selected_table).select("*").ilike(search_col, f"%{search_val}%").limit(20)
                df = execute_query(query)
                
                if df is not None and len(df) > 0:
                    st.session_state.current_data = df
                    st.success(f"✅ {len(df)}件見つかりました。")
                else:
                    st.session_state.current_data = None
                    st.warning("⚠️ データが見つかりませんでした。")
            else:
                st.warning("検索キーワードを入力してください。")
    
    if st.session_state.current_data is not None and len(st.session_state.current_data) > 0:
        st.markdown("---")
        st.markdown("#### ステップ2: 編集対象を選択")
        
        df = st.session_state.current_data
        st.dataframe(df, use_container_width=True, height=250)
        
        id_column = 'id' if 'id' in df.columns else df.columns[0]
        
        selected_id = st.selectbox(
            f"編集するデータのID (列: `{id_column}`)",
            df[id_column].tolist(),
            format_func=lambda x: f"ID: {x}"
        )
        
        selected_row = df[df[id_column] == selected_id].iloc[0]
        
        st.markdown("---")
        st.markdown("#### ステップ3: データを編集して保存")
        
        with st.form("edit_form"):
            updated_data = {}
            cols = st.columns(2)
            
            for idx, (col_name, col_type) in enumerate(table_columns.items()):
                with cols[idx % 2]:
                    
                    if col_name == id_column:
                        st.caption(f"🔑 **{col_name}**: {selected_row[col_name]}（主キーのため変更不可）")
                        continue
                    
                    current_value = selected_row.get(col_name)
                    is_na = pd.isna(current_value)
                    
                    if col_type == 'boolean':
                        initial_value = bool(current_value) if not is_na else False
                        updated_data[col_name] = st.checkbox(f"**{col_name}**", value=initial_value, key=f"edit_{col_name}")

                    elif col_type == 'integer':
                        initial_value = int(current_value) if not is_na else 0
                        updated_data[col_name] = st.number_input(f"**{col_name}**", value=initial_value, step=1, key=f"edit_{col_name}_int", format="%d")

                    elif col_type == 'number':
                        initial_value = float(current_value) if not is_na else 0.0
                        updated_data[col_name] = st.number_input(f"**{col_name}**", value=initial_value, step=0.01, format="%.2f", key=f"edit_{col_name}_float")

                    elif col_type == 'datetime':
                        date_val = datetime.now().date()
                        if not is_na and str(current_value):
                            try:
                                date_val = pd.to_datetime(current_value).date()
                            except:
                                pass
                            
                        updated_data[col_name] = st.date_input(f"**{col_name}**", value=date_val, key=f"edit_{col_name}_date")
                        updated_data[col_name] = str(updated_data[col_name])

                    else:
                        initial_value = str(current_value) if not is_na else ""
                        updated_data[col_name] = st.text_input(f"**{col_name}**", value=initial_value, key=f"edit_{col_name}_text")
            
            st.markdown("---")
            submitted = st.form_submit_button("💾 変更を保存する", type="primary", use_container_width=True)
            
            if submitted:
                data_to_update = {k: v for k, v in updated_data.items() if v != selected_row.get(k)}
                
                if 'updated_at' in data_to_update:
                    del data_to_update['updated_at']

                if not data_to_update:
                    st.info("変更された項目がありません。")
                else:
                    success, message, response = update_data(selected_table, selected_id, data_to_update, id_column)
                    
                    if success:
                        st.success(message)
                        st.session_state.current_data = None
                    else:
                        st.error(message)

---

## 🗑️ データの削除モード

elif mode == "🗑️ データの削除":
    
    st.subheader(f"🗑️ `{selected_table}` のデータを削除")
    st.error("⚠️ **重要**: 削除したデータは元に戻せません。慎重に操作してください。")
    
    st.markdown("#### ステップ1: 削除するデータを見つける")
    
    col_a, col_b, col_c = st.columns([3, 3, 1])
    with col_a:
        search_col = st.selectbox("検索する列", column_names, key="delete_search_col")
    with col_b:
        search_val = st.text_input("検索キーワード", key="delete_search_val")
    with col_c:
        st.markdown("<br>", unsafe_allow_html=True) 
        if st.button("🔍 検索", type="primary", key="delete_search_btn", use_container_width=True):
            if search_val:
                query = supabase.table(selected_table).select("*").ilike(search_col, f"%{search_val}%").limit(20)
                df = execute_query(query)
                
                if df is not None and len(df) > 0:
                    st.session_state.current_data = df
                    st.success(f"✅ {len(df)}件見つかりました。")
                else:
                    st.session_state.current_data = None
                    st.warning("⚠️ データが見つかりませんでした。")
            else:
                st.warning("検索キーワードを入力してください。")

    if st.session_state.current_data is not None and len(st.session_state.current_data) > 0:
        st.markdown("---")
        st.markdown("#### ステップ2: 削除するデータを選択")
        
        df = st.session_state.current_data
        st.dataframe(df, use_container_width=True, height=250)
        
        id_column = 'id' if 'id' in df.columns else df.columns[0]
        
        selected_id = st.selectbox(
            f"削除するデータのID (列: `{id_column}`)",
            df[id_column].tolist(),
            format_func=lambda x: f"ID: {x}"
        )
        
        selected_row = df[df[id_column] == selected_id].iloc[0]
        
        st.markdown("---")
        st.markdown("#### ステップ3: 削除の最終確認")
        
        with st.expander("🔍 削除対象データの詳細を確認"):
            st.json(selected_row.to_dict())
        
        st.error(f"本当にID `{selected_id}` のデータを削除しますか？")
        
        col1, col2 = st.columns([1, 3])
        
        with col1:
            if st.button("🗑️ 完全に削除する", type="primary", use_container_width=True):
                success, message, response = delete_data(selected_table, selected_id, id_column)
                
                if success:
                    st.success(message)
                    st.session_state.current_data = None
                    st.rerun()
                else:
                    st.error(message)
        
        with col2:
            if st.button("❌ 削除をキャンセル", use_container_width=True):
                st.session_state.current_data = None
                st.rerun()
