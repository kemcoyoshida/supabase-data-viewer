import streamlit as st
from supabase import create_client, Client
import pandas as pd
from datetime import datetime

# ========================================
# 接続情報
# ========================================

SUPABASE_URL = "https://uevlguozshzwywzqtsvr.supabase.co"

if "SUPABASE_KEY" in st.secrets:
    SUPABASE_KEY = st.secrets["SUPABASE_KEY"]
else:
    SUPABASE_KEY = None
    st.error("🚨 接続キーが設定されていません")
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

# ========================================
# 便利な関数
# ========================================

@st.cache_data(ttl=300)
def get_all_tables():
    """Supabaseから全テーブル名を取得"""
    try:
        # PostgreSQLの情報スキーマからテーブル一覧を取得
        response = supabase.rpc('get_table_names').execute()
        if response.data:
            return [table['table_name'] for table in response.data]
    except:
        pass
    
    # RPCが使えない場合は既知のテーブルを返す
    # ※実際には手動でテーブル名を列挙
    known_tables = ["t_machinecode", "t_employees", "t_sales"]
    return known_tables

@st.cache_data(ttl=300)
def get_table_structure(table_name: str):
    """テーブルの構造（列名とデータ型）を取得"""
    try:
        # 1件だけ取得して列を確認
        response = supabase.table(table_name).select("*").limit(1).execute()
        
        if response.data and len(response.data) > 0:
            sample_data = response.data[0]
            columns = {}
            
            for key, value in sample_data.items():
                # データ型を推測
                if isinstance(value, bool):
                    columns[key] = 'boolean'
                elif isinstance(value, int):
                    columns[key] = 'integer'
                elif isinstance(value, float):
                    columns[key] = 'number'
                elif isinstance(value, str):
                    # 日付っぽいか確認
                    if 'date' in key.lower() or 'time' in key.lower() or 'at' in key.lower():
                        columns[key] = 'datetime'
                    else:
                        columns[key] = 'text'
                else:
                    columns[key] = 'text'
            
            return columns
        
        return {}
    except Exception as e:
        st.error(f"テーブル構造の取得エラー: {e}")
        return {}

def build_query_with_conditions(table_name: str, conditions: list, order_by: str, order_direction: str, limit: int):
    """条件からクエリとSQL文を構築"""
    query = supabase.table(table_name).select("*")
    sql_parts = [f"SELECT * FROM {table_name}"]
    where_clauses = []
    
    # 条件を追加
    for cond in conditions:
        column = cond['column']
        operator = cond['operator']
        value = cond['value']
        
        if operator == "含む":
            query = query.ilike(column, f"%{value}%")
            where_clauses.append(f"{column} LIKE '%{value}%'")
        elif operator == "等しい":
            query = query.eq(column, value)
            where_clauses.append(f"{column} = '{value}'")
        elif operator == "含まない":
            query = query.not_.ilike(column, f"%{value}%")
            where_clauses.append(f"{column} NOT LIKE '%{value}%'")
        elif operator == "以上":
            query = query.gte(column, value)
            where_clauses.append(f"{column} >= {value}")
        elif operator == "以下":
            query = query.lte(column, value)
            where_clauses.append(f"{column} <= {value}")
        elif operator == "より大きい":
            query = query.gt(column, value)
            where_clauses.append(f"{column} > {value}")
        elif operator == "より小さい":
            query = query.lt(column, value)
            where_clauses.append(f"{column} < {value}")
        elif operator == "空でない":
            query = query.not_.is_('null', column)
            where_clauses.append(f"{column} IS NOT NULL")
        elif operator == "空":
            query = query.is_('null', column)
            where_clauses.append(f"{column} IS NULL")
    
    if where_clauses:
        sql_parts.append("WHERE " + " AND ".join(where_clauses))
    
    # ORDER BY
    if order_by and order_by != "なし":
        asc = order_direction == "昇順"
        query = query.order(order_by, desc=not asc)
        direction = "ASC" if asc else "DESC"
        sql_parts.append(f"ORDER BY {order_by} {direction}")
    
    # LIMIT
    query = query.limit(limit)
    sql_parts.append(f"LIMIT {limit}")
    
    sql_text = "\n".join(sql_parts)
    return query, sql_text

def execute_query(query):
    """クエリを実行"""
    try:
        response = query.execute()
        if response.data:
            return pd.DataFrame(response.data)
        return pd.DataFrame()
    except Exception as e:
        st.error(f"❌ クエリ実行エラー: {e}")
        return None

def insert_data(table_name: str, data: dict):
    """データを追加"""
    try:
        response = supabase.table(table_name).insert(data).execute()
        return True, "✅ データを追加しました"
    except Exception as e:
        return False, f"❌ エラー: {e}"

def update_data(table_name: str, row_id: any, data: dict, id_column: str = 'id'):
    """データを更新"""
    try:
        response = supabase.table(table_name).update(data).eq(id_column, row_id).execute()
        return True, "✅ データを更新しました"
    except Exception as e:
        return False, f"❌ エラー: {e}"

def delete_data(table_name: str, row_id: any, id_column: str = 'id'):
    """データを削除"""
    try:
        response = supabase.table(table_name).delete().eq(id_column, row_id).execute()
        return True, "✅ データを削除しました"
    except Exception as e:
        return False, f"❌ エラー: {e}"

# ========================================
# UI構築
# ========================================

st.set_page_config(page_title="データベース管理", layout="wide", page_icon="🗄️")

# ヘッダー
st.title("🗄️ データベース管理システム")
st.markdown("**誰でも簡単にデータベースを操作できます**（SQL知識不要）")

# ========================================
# サイドバー
# ========================================

st.sidebar.header("🎛️ 操作メニュー")

# モード選択
mode = st.sidebar.radio(
    "何をしますか？",
    ["📊 データを見る・検索", "➕ データを追加", "✏️ データを編集", "🗑️ データを削除"],
    label_visibility="collapsed"
)

st.sidebar.markdown("---")

# テーブル選択
st.sidebar.subheader("📁 テーブル選択")

# テーブル一覧を取得
with st.spinner("テーブル一覧を読み込み中..."):
    tables = get_all_tables()

if not tables:
    st.sidebar.warning("⚠️ テーブルが見つかりません")
    st.error("Supabaseにテーブルが存在しないか、アクセス権限がありません")
    st.stop()

selected_table = st.sidebar.selectbox(
    "テーブルを選択",
    tables,
    help="操作したいテーブルを選んでください"
)

# テーブルが変わったらセッションをリセット
if st.session_state.selected_table != selected_table:
    st.session_state.selected_table = selected_table
    st.session_state.conditions = []
    st.session_state.current_data = None

# テーブル構造を取得
table_columns = get_table_structure(selected_table)

if not table_columns:
    st.sidebar.error("❌ テーブル構造を取得できませんでした")
    st.stop()

column_names = list(table_columns.keys())

st.sidebar.success(f"✅ {len(column_names)}列のテーブル")

# ========================================
# モード1: データを見る・検索
# ========================================

if mode == "📊 データを見る・検索":
    
    st.sidebar.markdown("---")
    st.sidebar.subheader("🔍 検索条件")
    
    # 条件追加フォーム
    with st.sidebar.expander("➕ 条件を追加する", expanded=len(st.session_state.conditions) == 0):
        
        new_column = st.selectbox("列を選択", column_names, key="search_col")
        
        # 列のデータ型に応じて演算子を変える
        col_type = table_columns.get(new_column, 'text')
        
        if col_type in ['integer', 'number']:
            operators = ["等しい", "以上", "以下", "より大きい", "より小さい", "空でない", "空"]
        elif col_type == 'boolean':
            operators = ["等しい"]
        else:
            operators = ["含む", "等しい", "含まない", "空でない", "空"]
        
        new_operator = st.selectbox("条件", operators, key="search_op")
        
        # 値の入力（演算子によって不要な場合もある）
        if new_operator not in ["空でない", "空"]:
            if col_type == 'boolean':
                new_value = st.selectbox("値", ["true", "false"], key="search_val")
            elif col_type in ['integer', 'number']:
                new_value = st.number_input("値", key="search_val")
            elif col_type == 'datetime':
                new_value = st.date_input("日付", key="search_val")
                new_value = str(new_value)
            else:
                new_value = st.text_input("値", key="search_val")
        else:
            new_value = ""
        
        col_a, col_b = st.columns(2)
        with col_a:
            if st.button("➕ 追加", use_container_width=True):
                if new_operator in ["空でない", "空"] or new_value:
                    st.session_state.conditions.append({
                        'column': new_column,
                        'operator': new_operator,
                        'value': str(new_value) if new_value else ""
                    })
                    st.rerun()
                else:
                    st.warning("値を入力してください")
        
        with col_b:
            if st.button("🗑️ 全削除", use_container_width=True):
                st.session_state.conditions = []
                st.rerun()
    
    # 現在の条件を表示
    if st.session_state.conditions:
        st.sidebar.markdown("**📋 現在の条件:**")
        for idx, cond in enumerate(st.session_state.conditions):
            col1, col2 = st.sidebar.columns([5, 1])
            with col1:
                if cond['value']:
                    st.caption(f"{cond['column']} {cond['operator']} '{cond['value']}'")
                else:
                    st.caption(f"{cond['column']} {cond['operator']}")
            with col2:
                if st.button("❌", key=f"del_{idx}"):
                    st.session_state.conditions.pop(idx)
                    st.rerun()
    
    st.sidebar.markdown("---")
    st.sidebar.subheader("📋 並び替え")
    
    order_by = st.sidebar.selectbox("並び替える列", ["なし"] + column_names)
    order_direction = st.sidebar.radio("順序", ["昇順（小→大）", "降順（大→小）"])
    order_direction = "昇順" if "昇順" in order_direction else "降順"
    
    if order_by == "なし":
        order_by = None
    
    st.sidebar.markdown("---")
    
    limit = st.sidebar.slider("📊 最大表示件数", 10, 1000, 100, step=10)
    
    st.sidebar.markdown("---")
    
    search_button = st.sidebar.button("🔍 検索実行", type="primary", use_container_width=True)
    
    # メインエリア
    if search_button:
        query, sql_text = build_query_with_conditions(
            selected_table,
            st.session_state.conditions,
            order_by,
            order_direction,
            limit
        )
        
        # SQL表示（折りたたみ）
        with st.expander("🔧 生成されたSQL文（技術者向け）"):
            st.code(sql_text, language="sql")
        
        # データ取得
        with st.spinner("📥 データを取得中..."):
            df = execute_query(query)
        
        if df is not None and len(df) > 0:
            st.session_state.current_data = df
            
            # メトリクス
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("📊 取得件数", f"{len(df):,} 件")
            with col2:
                st.metric("📂 列数", f"{len(df.columns)} 列")
            with col3:
                st.metric("🔍 条件数", f"{len(st.session_state.conditions)} 個")
            
            st.markdown("---")
            
            # データ表示
            st.subheader(f"📋 検索結果：{selected_table}")
            st.dataframe(df, use_container_width=True, height=400)
            
            # ダウンロード
            csv = df.to_csv(index=False).encode('utf-8-sig')
            st.download_button(
                "📥 CSVでダウンロード",
                csv,
                f"{selected_table}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                "text/csv",
                use_container_width=True
            )
            
            # 詳細情報
            with st.expander("📊 統計情報"):
                numeric_cols = df.select_dtypes(include=['number']).columns
                if len(numeric_cols) > 0:
                    st.dataframe(df[numeric_cols].describe().T)
                else:
                    st.info("数値列がありません")
            
        elif df is not None:
            st.warning("⚠️ 条件に一致するデータが見つかりませんでした")
            st.info("💡 検索条件を変更してみてください")
        else:
            st.error("❌ データ取得に失敗しました")
    
    else:
        st.info("👈 左のサイドバーで条件を設定して「検索実行」ボタンを押してください")

# ========================================
# モード2: データを追加
# ========================================

elif mode == "➕ データを追加":
    
    st.subheader(f"➕ {selected_table} に新しいデータを追加")
    
    st.markdown("**フォームに情報を入力してください**")
    
    with st.form("add_form"):
        new_data = {}
        
        # 各列の入力フィールドを作成
        cols = st.columns(2)
        
        for idx, (col_name, col_type) in enumerate(table_columns.items()):
            
            with cols[idx % 2]:
                
                # id列は自動採番されることが多いのでスキップ
                if col_name.lower() in ['id'] and col_type == 'integer':
                    st.caption(f"🔑 {col_name}（自動採番）")
                    continue
                
                # created_at, updated_atも自動設定されることが多い
                if col_name.lower() in ['created_at', 'updated_at']:
                    st.caption(f"🕐 {col_name}（自動設定）")
                    continue
                
                # データ型に応じた入力フィールド
                if col_type == 'boolean':
                    new_data[col_name] = st.checkbox(f"{col_name}", key=f"add_{col_name}")
                elif col_type == 'integer':
                    new_data[col_name] = st.number_input(f"{col_name}", step=1, key=f"add_{col_name}")
                elif col_type == 'number':
                    new_data[col_name] = st.number_input(f"{col_name}", step=0.01, format="%.2f", key=f"add_{col_name}")
                elif col_type == 'datetime':
                    date_val = st.date_input(f"{col_name}", key=f"add_{col_name}")
                    new_data[col_name] = str(date_val)
                else:
                    new_data[col_name] = st.text_input(f"{col_name}", key=f"add_{col_name}")
        
        submitted = st.form_submit_button("✅ 追加する", type="primary", use_container_width=True)
        
        if submitted:
            # 空の値を除外
            filtered_data = {k: v for k, v in new_data.items() if v != "" and v is not None}
            
            if filtered_data:
                success, message = insert_data(selected_table, filtered_data)
                
                if success:
                    st.success(message)
                    st.balloons()
                    
                    # 追加されたデータを表示
                    with st.expander("📋 追加されたデータ"):
                        st.json(filtered_data)
                else:
                    st.error(message)
            else:
                st.warning("⚠️ 少なくとも1つの項目を入力してください")

# ========================================
# モード3: データを編集
# ========================================

elif mode == "✏️ データを編集":
    
    st.subheader(f"✏️ {selected_table} のデータを編集")
    
    # まずデータを検索して選択
    st.markdown("**ステップ1: 編集するデータを検索**")
    
    # 簡易検索
    search_col = st.selectbox("検索する列", column_names)
    search_val = st.text_input("検索値", placeholder="例: ABC123")
    
    if st.button("🔍 検索", type="primary"):
        query = supabase.table(selected_table).select("*").ilike(search_col, f"%{search_val}%").limit(20)
        df = execute_query(query)
        
        if df is not None and len(df) > 0:
            st.session_state.current_data = df
            st.success(f"✅ {len(df)}件見つかりました")
        else:
            st.warning("⚠️ データが見つかりませんでした")
    
    # 編集対象を選択
    if st.session_state.current_data is not None and len(st.session_state.current_data) > 0:
        st.markdown("---")
        st.markdown("**ステップ2: 編集するデータを選択**")
        
        df = st.session_state.current_data
        st.dataframe(df, use_container_width=True)
        
        # ID列を探す
        id_column = 'id' if 'id' in df.columns else df.columns[0]
        
        selected_id = st.selectbox(
            "編集するデータのID",
            df[id_column].tolist(),
            format_func=lambda x: f"{id_column}: {x}"
        )
        
        # 選択されたデータを取得
        selected_row = df[df[id_column] == selected_id].iloc[0]
        
        st.markdown("---")
        st.markdown("**ステップ3: データを編集**")
        
        with st.form("edit_form"):
            updated_data = {}
            
            cols = st.columns(2)
            
            for idx, (col_name, col_type) in enumerate(table_columns.items()):
                
                with cols[idx % 2]:
                    
                    # ID列は編集不可
                    if col_name == id_column:
                        st.caption(f"🔑 {col_name}: {selected_row[col_name]}（変更不可）")
                        continue
                    
                    # 現在の値
                    current_value = selected_row.get(col_name, "")
                    
                    # データ型に応じた入力
                    if col_type == 'boolean':
                        updated_data[col_name] = st.checkbox(
                            f"{col_name}",
                            value=bool(current_value),
                            key=f"edit_{col_name}"
                        )
                    elif col_type == 'integer':
                        updated_data[col_name] = st.number_input(
                            f"{col_name}",
                            value=int(current_value) if current_value else 0,
                            step=1,
                            key=f"edit_{col_name}"
                        )
                    elif col_type == 'number':
                        updated_data[col_name] = st.number_input(
                            f"{col_name}",
                            value=float(current_value) if current_value else 0.0,
                            step=0.01,
                            key=f"edit_{col_name}"
                        )
                    else:
                        updated_data[col_name] = st.text_input(
                            f"{col_name}",
                            value=str(current_value) if current_value else "",
                            key=f"edit_{col_name}"
                        )
            
            submitted = st.form_submit_button("💾 保存する", type="primary", use_container_width=True)
            
            if submitted:
                success, message = update_data(selected_table, selected_id, updated_data, id_column)
                
                if success:
                    st.success(message)
                    st.balloons()
                    st.session_state.current_data = None
                else:
                    st.error(message)

# ========================================
# モード4: データを削除
# ========================================

elif mode == "🗑️ データを削除":
    
    st.subheader(f"🗑️ {selected_table} のデータを削除")
    
    st.warning("⚠️ **注意**: 削除したデータは元に戻せません")
    
    # データを検索
    st.markdown("**ステップ1: 削除するデータを検索**")
    
    search_col = st.selectbox("検索する列", column_names)
    search_val = st.text_input("検索値")
    
    if st.button("🔍 検索", type="primary"):
        query = supabase.table(selected_table).select("*").ilike(search_col, f"%{search_val}%").limit(20)
        df = execute_query(query)
        
        if df is not None and len(df) > 0:
            st.session_state.current_data = df
            st.success(f"✅ {len(df)}件見つかりました")
        else:
            st.warning("⚠️ データが見つかりませんでした")
    
    # 削除対象を選択
    if st.session_state.current_data is not None and len(st.session_state.current_data) > 0:
        st.markdown("---")
        st.markdown("**ステップ2: 削除するデータを選択**")
        
        df = st.session_state.current_data
        st.dataframe(df, use_container_width=True)
        
        id_column = 'id' if 'id' in df.columns else df.columns[0]
        
        selected_id = st.selectbox(
            "削除するデータのID",
            df[id_column].tolist(),
            format_func=lambda x: f"{id_column}: {x}"
        )
        
        # 選択されたデータを表示
        selected_row = df[df[id_column] == selected_id].iloc[0]
        
        st.markdown("---")
        st.markdown("**ステップ3: 削除の確認**")
        
        with st.expander("🔍 削除するデータの詳細"):
            st.json(selected_row.to_dict())
        
        st.error("⚠️ 本当にこのデータを削除しますか？この操作は取り消せません。")
        
        col1, col2 = st.columns([1, 3])
        
        with col1:
            if st.button("🗑️ 削除する", type="primary", use_container_width=True):
                success, message = delete_data(selected_table, selected_id, id_column)
                
                if success:
                    st.success(message)
                    st.session_state.current_data = None
                    st.rerun()
                else:
                    st.error(message)
        
        with col2:
            if st.button("❌ キャンセル", use_container_width=True):
                st.session_state.current_data = None
                st.rerun()

# ========================================
# フッター
# ========================================

st.sidebar.markdown("---")
st.sidebar.caption("🗄️ データベース管理システム v2.0")
st.sidebar.caption("💡 IT知識不要で誰でも使えます")
