# -*- coding: utf-8 -*-
import streamlit as st
from supabase import create_client, Client
import pandas as pd
from datetime import datetime
import re

# ========================================
# 接続情報 (🚨 警告: キーを直接コードに記述しています - セキュリティリスクあり)
# ========================================
SUPABASE_URL = "https://uevlguozshzwywzqtsvr.supabase.co" 
# 以前のコードから取得したダミーキーを直接記述します
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldmxndW96c2h6d3l3enF0c3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjkzMDcsImV4cCI6MjA3NDkwNTMwN30.hx82K_19c5Mmh9NXCCf15_yGDPLJ5O_XM_CnWuVMyZ8"

# Streamlitのキャッシュ機能を使ってSupabaseクライアントを保持
@st.cache_resource
def init_connection(url, key):
    """Supabaseクライアントを初期化し、リソースとしてキャッシュする"""
    try:
        return create_client(url, key)
    except Exception as e:
        st.error(f"❌ Supabase接続エラーが発生しました: {e}")
        st.stop() 

supabase = init_connection(SUPABASE_URL, SUPABASE_KEY)

# ========================================
# ページ設定
# ========================================
st.set_page_config(
    page_title="データベース管理", 
    layout="wide", 
    page_icon="📊",
    initial_sidebar_state="expanded"
)

# 洗練されたCSS (🎨 ブラウン系デザイン)
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    .stApp {
        background-color: #f7f3ed; /* ベースの背景: 非常に薄いベージュ */
        color: #3e2723; /* 基本テキスト: 濃い茶色 */
        font-family: 'Inter', sans-serif;
    }
    
    /* 暖色系のカラーパレット */
    /* プライマリカラー: 落ち着いたブラウン */
    :root {
        --primary-brown: #5d4037; /* 濃いコーヒー色 */
        --light-brown: #a1887f;  /* 明るいテラコッタ */
        --accent-beige: #efebe9; /* アクセントの薄いベージュ */
        --success-green: #689f38; /* 成功時の色（視認性のためグリーン系を維持） */
    }

    h1, h2, h3 {
        color: var(--primary-brown); /* 濃いブラウンの見出し */
    }
    
    /* サイドバーのタイトル */
    .st-emotion-cache-1r650o0 { 
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--primary-brown); 
        padding-top: 10px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--light-brown);
    }
    
    /* メインコンテンツのパディング */
    .st-emotion-cache-1cypcdb { 
        padding: 2rem 3rem;
    }
    
    /* タブのフォントサイズ */
    .stTabs [data-baseweb="tab-list"] button [data-testid="stMarkdownContainer"] p {
        font-size:1.1rem;
    }
    
    /* タブのリストのスタイル */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        border-bottom: 2px solid var(--primary-brown); /* ブラウンの下線 */
        margin-bottom: 15px;
    }
    
    /* 通常のタブ */
    .stTabs [data-baseweb="tab"] {
        background-color: var(--accent-beige);
        border-radius: 6px 6px 0 0;
        padding: 10px 15px;
        color: var(--primary-brown);
        font-weight: 500;
        transition: all 0.2s ease;
    }
    
    /* 選択中のタブ */
    .stTabs [aria-selected="true"] {
        background-color: var(--primary-brown) !important;
        color: white !important;
        font-weight: 700;
        border-top: 3px solid var(--primary-brown);
    }
    
    /* ボタン (primary) */
    .stButton > button {
        background-color: var(--primary-brown); /* ブラウンボタン */
        color: white;
        font-weight: 600;
        border: none;
        transition: background-color 0.2s;
    }
    
    /* ホバー時のボタン */
    .stButton > button:hover {
        background-color: #795548; /* 少し明るいブラウン */
    }

    /* 警告・情報ボックス */
    [data-testid="stAlert"] {
        background-color: var(--accent-beige);
        border-left: 5px solid var(--light-brown);
        color: var(--primary-brown);
    }
    
    .stAlert p {
        color: var(--primary-brown);
    }
    
</style>
""", unsafe_allow_html=True)

# ========================================
# データベース関数
# ========================================

@st.cache_data(ttl=3600) 
def get_available_tables():
    """
    Supabaseのテーブル一覧を取得します。
    注: 以下のRPC呼び出しは、Supabaseにカスタムで作成したPostgreSQL関数
    `get_tables_in_schema`が存在することを前提としています。
    """
    try:
        # RPC呼び出し (カスタム関数前提)
        response = supabase.rpc('get_tables_in_schema', {'schema_name': 'public'}).execute()
        
        # エラー処理
        if hasattr(response, 'error') and response.error:
             st.warning(f"⚠️ テーブル一覧取得RPCエラー: {response.error.message}")
             st.info("💡 SupabaseにカスタムRPC関数 `get_tables_in_schema` が存在するか確認してください。")
             return []

        if response.data:
            # テーブル名だけをリスト化
            tables = [item['table_name'] for item in response.data if item.get('table_type') == 'BASE TABLE']
            return sorted(tables)

    except Exception as e:
        st.warning(f"⚠️ テーブル一覧取得で例外が発生: {e}")
        # フォールバックリスト (デバッグ用)
        fall_back_tables = [
            'T_AcceptOrder', 'T_Expense', 't_machinecode', 
            'T_NewTable', 'products', 'customers', 
            'orders', 'suppliers',
        ]
        st.info(f"💡 フォールバックのテーブルリストを使用: {', '.join(fall_back_tables)}")
        return sorted(fall_back_tables)

    return []

@st.cache_data(ttl=60)
def get_table_data(table_name, limit=1000):
    """指定されたテーブルからデータを取得する"""
    if not table_name:
        return None
    try:
        response = supabase.from_(table_name).select('*').limit(limit).execute()
        if response.data:
            return pd.DataFrame(response.data)
        return pd.DataFrame()
    except Exception as e:
        st.error(f"データの取得中にエラーが発生しました: {e}")
        return None

@st.cache_data(ttl=3600) 
def get_table_columns(table_name):
    """指定されたテーブルのカラム名を取得する"""
    if not table_name:
        return []
    try:
        # 注意: get_table_columns はカスタムRPCを想定
        response = supabase.rpc('get_table_columns', {'t_name': table_name}).execute()
        if response.data:
            return [col['column_name'] for col in response.data]
        # RPCが失敗した場合、ダミーデータでフォールバック
        df = get_table_data(table_name, limit=1)
        if df is not None and not df.empty:
             return list(df.columns)
        return []
    except Exception as e:
        # フォールバックとしてデータ取得からカラム名を取得
        df = get_table_data(table_name, limit=1)
        if df is not None and not df.empty:
             return list(df.columns)
        return []

def get_config_key(key):
    """st.session_stateから設定値を取得するヘルパー関数"""
    return st.session_state.get(key, '')

def set_config_key(key, value):
    """st.session_stateに設定値を保存するヘルパー関数"""
    st.session_state[key] = value

# ========================================
# SQLクエリ生成ロジック
# ========================================

def build_sql_query(config):
    """設定に基づいてSQLクエリ文字列を構築する"""
    select_parts = []
    
    # SELECT句の構築
    if config['select_fields']:
        for field in config['select_fields']:
            part = f"{field['table']}.{field['field']}"
            if field['alias']:
                part += f" AS \"{field['alias']}\""
            select_parts.append(part)
    
    # SELECT句が空の場合は全てのカラムを選択
    if not select_parts:
        select_clause = f"SELECT {config['from_table']}.*"
    else:
        select_clause = "SELECT " + ", ".join(select_parts)

    # FROM句
    from_clause = f"FROM {config['from_table']}"

    # JOIN句の構築
    join_clauses = []
    for join in config['joins']:
        join_type = join['type'].upper()
        join_table = join['table']
        join_on = join['on']
        join_clauses.append(f"{join_type} JOIN {join_table} ON {join_on}")

    # WHERE句の構築
    where_parts = []
    if config['where_conditions']:
        for cond in config['where_conditions']:
            field = cond['field']
            op = cond['operator']
            value = cond['value']
            
            # IS NULL / IS NOT NULL の特殊処理
            if op in ('IS NULL', 'IS NOT NULL'):
                where_parts.append(f"{field} {op}")
            # LIKE の処理
            elif op == 'LIKE':
                # シングルクォートをエスケープ
                safe_value = value.replace("'", "''") 
                where_parts.append(f"{field} LIKE '{safe_value}'")
            # 通常の値（数値、文字列）の処理
            else:
                if isinstance(value, str) and not re.match(r'^-?\d+(\.\d+)?$', value):
                    # 文字列をシングルクォートで囲む
                    safe_value = value.replace("'", "''") 
                    where_parts.append(f"{field} {op} '{safe_value}'")
                else:
                    where_parts.append(f"{field} {op} {value}")

    where_clause = ""
    if where_parts:
        where_clause = "WHERE " + " AND ".join(where_parts)

    # ORDER BY句の構築
    order_by_clause = ""
    if config['order_by_field']:
        order_by_clause = f"ORDER BY {config['order_by_field']} {config['order_by_direction']}"

    # LIMIT句の構築
    limit_clause = f"LIMIT {config['limit']}"

    # 全てを結合
    query = f"{select_clause}\n{from_clause}"
    if join_clauses:
        query += "\n" + "\n".join(join_clauses)
    if where_clause:
        query += "\n" + where_clause
    if order_by_clause:
        query += "\n" + order_by_clause
    if limit_clause:
        query += "\n" + limit_clause
        
    return query + ";"

# ========================================
# UI コンポーネント (フォームやタブの定義)
# ========================================

def render_sql_builder_tab():
    """SQLクエリビルダのタブをレンダリングする"""
    st.subheader("🛠️ SQLクエリビルダ")
    
    # 既存のテーブルリストを取得
    available_tables = get_available_tables()

    # セッションステートの初期化
    if 'sql_builder_config' not in st.session_state:
        st.session_state.sql_builder_config = {
            'from_table': '',
            'select_fields': [],
            'joins': [],
            'where_conditions': [],
            'order_by_field': '',
            'order_by_direction': 'ASC',
            'limit': 100
        }

    config = st.session_state.sql_builder_config

    # サイドバーに設定パネルを配置
    with st.sidebar:
        st.markdown("## ⚙️ クエリ設定パネル")
        
        # 1. FROMテーブルの選択
        st.markdown("### 1. メインテーブル (FROM)")
        if available_tables:
            selected_table = st.selectbox(
                "テーブルを選択", 
                options=[''] + available_tables,
                index=available_tables.index(config['from_table']) + 1 if config['from_table'] in available_tables else 0,
                key='from_table_select'
            )
            config['from_table'] = selected_table
            
        else:
            st.warning("テーブルが見つかりませんでした。")
            
        st.markdown("---")

        if config['from_table']:
            current_columns = get_table_columns(config['from_table'])
            column_options = [f"{config['from_table']}.{col}" for col in current_columns]

            # 2. SELECTフィールドの管理
            st.markdown("### 2. フィールド選択 (SELECT)")
            col1, col2 = st.columns([1, 1])
            if col1.button("＋ フィールド追加", key="add_select"):
                config['select_fields'].append({'table': config['from_table'], 'field': '', 'alias': ''})
            if col2.button("－ 全て削除", key="clear_select"):
                config['select_fields'] = []
            
            for i, field in enumerate(config['select_fields']):
                st.markdown(f"**フィールド {i+1}**")
                
                # テーブル選択 (現状はメインテーブルに固定)
                st.text_input("テーブル", value=config['from_table'], disabled=True, key=f"select_table_{i}")
                
                # フィールド選択
                if current_columns:
                    field_name = st.selectbox(
                        "フィールド名", 
                        options=[''] + current_columns, 
                        index=current_columns.index(field.get('field', '')) + 1 if field.get('field') in current_columns else 0,
                        key=f"select_field_{i}"
                    )
                    config['select_fields'][i]['field'] = field_name
                
                # 別名 (エイリアス)
                alias = st.text_input("別名 (AS)", value=field.get('alias', ''), key=f"select_alias_{i}")
                config['select_fields'][i]['alias'] = alias
                
                # 削除ボタン
                if st.button(f"🗑️ 削除", key=f"remove_select_{i}"):
                    config['select_fields'].pop(i)
                    st.rerun() 
                st.markdown("---")
            
            st.markdown("---")
            
            # 3. JOIN句の管理
            st.markdown("### 3. テーブル結合 (JOIN)")
            if st.button("＋ JOIN追加", key="add_join"):
                config['joins'].append({'type': 'LEFT', 'table': '', 'on': ''})

            for i, join in enumerate(config['joins']):
                st.markdown(f"**JOIN {i+1}**")
                
                # 結合タイプ
                join_type = st.selectbox(
                    "結合タイプ", 
                    options=['LEFT', 'INNER', 'RIGHT', 'FULL'], 
                    index=['LEFT', 'INNER', 'RIGHT', 'FULL'].index(join.get('type', 'LEFT')),
                    key=f"join_type_{i}"
                )
                config['joins'][i]['type'] = join_type
                
                # 結合テーブル
                join_table = st.selectbox(
                    "結合テーブル", 
                    options=[''] + available_tables,
                    index=available_tables.index(join.get('table', '')) + 1 if join.get('table') in available_tables else 0,
                    key=f"join_table_{i}"
                )
                config['joins'][i]['table'] = join_table
                
                # 結合条件 (ON)
                join_on = st.text_area("結合条件 (例: table1.col = table2.col)", value=join.get('on', ''), key=f"join_on_{i}")
                config['joins'][i]['on'] = join_on
                
                # 削除ボタン
                if st.button(f"🗑️ JOIN削除", key=f"remove_join_{i}"):
                    config['joins'].pop(i)
                    st.rerun() 
                st.markdown("---")

    # メインコンテンツエリア：WHERE句と実行
    if config['from_table']:
        
        current_columns = get_table_columns(config['from_table'])
        column_options = [f"{config['from_table']}.{col}" for col in current_columns]

        # 4. WHERE句の管理 (タブの外)
        st.markdown("### 4. フィルタリング (WHERE)")
        if st.button("＋ 条件追加 (AND)", key="add_where"):
            config['where_conditions'].append({'field': '', 'operator': '=', 'value': ''})

        for i, cond in enumerate(config['where_conditions']):
            col1, col2, col3, col4 = st.columns([2, 1, 2, 0.5])
            
            # フィールド選択 (結合テーブルのカラムも選択肢に含めるべきだが、ここでは単純化のためメインテーブルのみ)
            with col1:
                field_select = st.selectbox(
                    f"フィールド {i+1}",
                    options=[''] + column_options,
                    index=column_options.index(cond.get('field', '')) + 1 if cond.get('field') in column_options else 0,
                    key=f"where_field_{i}"
                )
                config['where_conditions'][i]['field'] = field_select
            
            # 演算子
            operators = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IS NULL', 'IS NOT NULL']
            with col2:
                op_select = st.selectbox(
                    "演算子",
                    options=operators,
                    index=operators.index(cond.get('operator', '=')),
                    key=f"where_op_{i}"
                )
                config['where_conditions'][i]['operator'] = op_select
            
            # 値 (IS NULL/IS NOT NULL の場合は非表示)
            with col3:
                is_value_needed = op_select not in ('IS NULL', 'IS NOT NULL')
                if is_value_needed:
                    value_input = st.text_input(
                        "値",
                        value=cond.get('value', ''),
                        key=f"where_value_{i}"
                    )
                    config['where_conditions'][i]['value'] = value_input
                else:
                    config['where_conditions'][i]['value'] = '' # 値をクリア
                    st.empty() # 値の入力フィールドを隠す
            
            # 削除ボタン
            with col4:
                st.markdown("<div style='height: 27px;'></div>", unsafe_allow_html=True) # アライメント調整
                if st.button(f"🗑️", key=f"remove_where_{i}"):
                    config['where_conditions'].pop(i)
                    st.rerun() 

        st.markdown("---")
        
        # 5. ORDER BY と LIMIT
        st.markdown("### 5. ソートと制限 (ORDER BY / LIMIT)")
        col_o1, col_o2, col_l = st.columns(3)
        with col_o1:
            # ORDER BY フィールド
            order_by_options = [re.sub(r'^[^\.]+\.', '', col) for col in column_options]
            order_by_field = st.selectbox(
                "ソートフィールド (ORDER BY)",
                options=[''] + order_by_options,
                index=order_by_options.index(config['order_by_field']) + 1 if config['order_by_field'] in order_by_options else 0,
                key="sql_orderby"
            )
            config['order_by_field'] = order_by_field

        with col_o2:
            # ORDER BY 方向
            order_by_direction = st.selectbox(
                "方向",
                options=['ASC', 'DESC'],
                index=['ASC', 'DESC'].index(config['order_by_direction']),
                key="sql_orderdir"
            )
            config['order_by_direction'] = order_by_direction

        with col_l:
            # LIMIT
            limit = st.number_input(
                "行数制限 (LIMIT)",
                min_value=1,
                max_value=1000,
                value=config['limit'],
                key="sql_limit"
            )
            config['limit'] = limit

        st.markdown("---")

        generated_sql = build_sql_query(config)
        st.markdown("### ✨ 生成されたSQLクエリ")
        st.code(generated_sql, language='sql')
        
        st.markdown("---")
        
        st.markdown("### ▶️ クエリの結果")
        
        # SQL実行ボタン
        if st.button("▶️ クエリを実行", type="primary", use_container_width=True):
            
            try:
                # 💡 注意事項
                st.warning("⚠️ Streamlitアプリ内でのJOINを含む複雑なSQLクエリの実行は、セキュリティ上の制約により通常サポートされていません。単純なSELECTクエリの場合のみ結果を表示します。")
                
                # ここでは単純なFROM句のクエリのみを想定した結果表示を試みる
                # ユーザーのSQLビルダークエリは実行しない（JOINを含む可能性があるため）
                if not config['joins'] and not config['select_fields'] and not config['where_conditions']:
                    df_result = get_table_data(config['from_table'], config['limit'])
                    if df_result is not None and len(df_result) > 0:
                         st.success(f"✅ クエリ結果 (簡易表示)")
                         st.dataframe(df_result)
                    elif df_result is not None:
                        st.info("データが見つかりませんでした。")
                else:
                    st.info("複雑なJOINやWHERE条件を持つクエリの結果は、セキュリティ上の理由から表示をスキップしました。生成されたSQLをSupabaseのSQL Editorで直接実行してください。")
            
            except Exception as e:
                st.error(f"❌ クエリ実行エラー: {e}")
                st.info("💡 複雑なJOINクエリはSupabaseのSQL Editorで実行してください。単純なクエリのみこちらで実行可能です。")
        
        st.markdown("")
        st.success("✅ SQLが生成されました！")
        st.info("💡 単純なクエリは「▶️ クエリを実行」ボタンで結果を確認できます。複雑なJOINクエリはSupabaseのSQL Editorで実行してください。")
        
        # 使用例
        with st.expander("📖 使い方の例を見る"):
            st.markdown("""
            ### 📌 例：納期が迫っている未納入の注文を検索
            
            **1. メインテーブル**
            ```
            T_Expense
            ```
            
            **2. フィールド選択**
            - テーブル: `T_Expense`, フィールド: `PurchaseNo`, 別名: `注文番号`
            - テーブル: `T_Expense`, フィールド: `Description`, 別名: `品名`
            - テーブル: `T_Expense`, フィールド: `DeliveryDate`, 別名: `納期`
            
            **3. テーブル結合**
            - 結合タイプ: `LEFT`
            - 結合テーブル: `T_AcceptOrder`
            - 結合条件: `T_Expense.ConstructionNo = T_AcceptOrder.ConstructNo`
            
            **4. 条件（WHERE）**
            - フィールド: `NounyuDate`, 演算子: `IS NULL`
            - フィールド: `DeliveryDate`, 演算子: `<`, 値: `current_date`
            
            **5. ソートと制限**
            - ソートフィールド: `DeliveryDate`, 方向: `ASC`
            """)

def render_data_view_tab():
    """テーブルデータを閲覧するタブをレンダリングする"""
    st.subheader("👀 テーブルデータ閲覧")
    available_tables = get_available_tables()

    if available_tables:
        selected_table = st.selectbox(
            "表示するテーブルを選択",
            options=available_tables,
            key="data_view_table"
        )
        
        if selected_table:
            # データを取得（キャッシュを利用）
            df = get_table_data(selected_table, limit=500)
            
            if df is not None and not df.empty:
                st.success(f"✅ テーブル `{selected_table}` のデータ (上位 {len(df)} 行)")
                st.dataframe(df)
            elif df is not None:
                st.info("このテーブルにはデータがありません。")
            else:
                st.error("データの取得に失敗しました。")
    else:
        st.warning("表示できるテーブルがありません。Supabase接続とテーブルの存在を確認してください。")

# ========================================
# メインアプリケーション
# ========================================

def main():
    st.title("📊 Supabase データベース管理ツール")
    st.markdown("---")
    
    # タブの表示
    tab1, tab2 = st.tabs(["📝 SQLクエリビルダ", "👀 データビューア"])
    
    with tab1:
        render_sql_builder_tab()
        
    with tab2:
        render_data_view_tab()

if __name__ == "__main__":
    main()
