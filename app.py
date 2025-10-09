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
DATABASE_URL = "postgresql://postgres:20251002@db.uevlguozshzwywzqtsvr.supabase.co:5432/postgres"

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

# 洗練されたベージュ/グリーン系CSS
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
    font-family: 'Inter', sans-serif;
}

.main {
    background: #f5f5f0;
    padding: 1rem 2rem;
}

[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #9caf88 0%, #8b9d7a 100%);
    padding: 0;
}

[data-testid="stSidebar"] * {
    color: #2d3a2e !important;
}

[data-testid="stSidebar"] .stMarkdown {
    color: #2d3a2e !important;
}

[data-testid="stSidebar"] p, 
[data-testid="stSidebar"] span,
[data-testid="stSidebar"] .stCaption {
    color: #2d3a2e !important;
}

[data-testid="stSidebar"] .element-container * {
    color: #2d3a2e !important;
}

[data-testid="stSidebar"] > div:first-child {
    padding: 2rem 1rem;
}

[data-testid="stSidebar"] .stRadio > label {
    display: none;
}

[data-testid="stSidebar"] .stRadio > div {
    gap: 0.5rem;
}

[data-testid="stSidebar"] .stRadio > div > label {
    background: rgba(255, 255, 255, 0.3);
    padding: 0.875rem 1rem;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
    font-weight: 500;
    font-size: 15px;
    min-height: 48px;
    display: flex;
    align-items: center;
    color: #2d3a2e !important;
}

[data-testid="stSidebar"] .stRadio > div > label:hover {
    background: rgba(255, 255, 255, 0.5);
    transform: translateX(5px);
}

[data-testid="stSidebar"] .stRadio > div > label[data-checked="true"] {
    background: rgba(255, 255, 255, 0.7);
    border-left: 4px solid #6b7c5e;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(107, 124, 94, 0.2);
}

[data-testid="stSidebar"] .stButton > button {
    width: 100%;
    height: 48px;
    font-size: 15px;
    font-weight: 600;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.8);
    color: #4a5c3e;
    border: 2px solid #8b9d7a;
    transition: all 0.3s;
    box-shadow: 0 2px 8px rgba(107, 124, 94, 0.15);
}

[data-testid="stSidebar"] .stButton > button:hover {
    background: white;
    border-color: #6b7c5e;
    box-shadow: 0 4px 16px rgba(107, 124, 94, 0.25);
    transform: translateY(-2px);
}

[data-testid="stMetric"] {
    background: white;
    padding: 1rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    border: 1px solid #e5e5e0;
}

[data-testid="stMetricValue"] {
    font-size: 28px;
    font-weight: 700;
    color: #6b7c5e;
}

[data-testid="stMetricLabel"] {
    font-size: 12px;
    font-weight: 600;
    color: #8b9d7a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.stButton > button {
    border-radius: 8px;
    height: 48px;
    font-weight: 600;
    font-size: 15px;
    border: none;
    background: #8b9d7a;
    color: white;
    transition: all 0.3s;
    box-shadow: 0 2px 6px rgba(107, 124, 94, 0.2);
}

.stButton > button:hover {
    background: #7a8c6b;
    box-shadow: 0 4px 12px rgba(107, 124, 94, 0.3);
    transform: translateY(-2px);
}

.dataframe {
    border-radius: 8px;
    border: 1px solid #e5e5e0;
    font-size: 14px;
    background: white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.page-title {
    font-size: 28px;
    font-weight: 800;
    color: #4a5c3e;
    margin-bottom: 0.25rem;
}

.page-subtitle {
    font-size: 14px;
    color: #6b7c5e;
    margin-bottom: 1rem;
    font-weight: 500;
}

.stTabs [data-baseweb="tab-list"] {
    gap: 8px;
    background-color: transparent;
    border-bottom: 2px solid #e5e5e0;
}

.stTabs [data-baseweb="tab"] {
    background-color: transparent;
    border-radius: 10px 10px 0 0;
    padding: 12px 24px;
    font-weight: 600;
    font-size: 15px;
    border: none;
    color: #6b7c5e;
}

.stTabs [aria-selected="true"] {
    background: white;
    color: #4a5c3e;
    border-bottom: 3px solid #8b9d7a;
}

.streamlit-expanderHeader {
    background: white;
    border-radius: 12px;
    font-weight: 600;
    font-size: 16px;
    border: 1px solid #e5e5e0;
    color: #4a5c3e;
}

.stSuccess {
    background-color: #f0f5ed;
    border-left: 4px solid #9caf88;
    color: #4a5c3e;
}

.stInfo {
    background-color: #fafaf8;
    border-left: 4px solid #a8b89a;
    color: #6b7c5e;
}

.stWarning {
    background-color: #fef9e7;
    border-left: 4px solid #d4a574;
    color: #8b6f47;
}

.info-card {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    border: 1px solid #e5e5e0;
    transition: all 0.3s;
}

.info-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    transform: translateY(-2px);
}

.info-card-blue {
    border-top: 3px solid #8b9d7a;
}

.info-card-orange {
    border-top: 3px solid #a8b89a;
}

.info-card-green {
    border-top: 3px solid #9caf88;
}

.card-header {
    font-size: 16px;
    font-weight: 700;
    color: #4a5c3e;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 8px;
}

.card-header-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
}

.info-list-item {
    padding: 0.5rem 0.75rem;
    margin: 0.35rem 0;
    background: #fafaf8;
    border-radius: 8px;
    border-left: 3px solid #9caf88;
    font-size: 13px;
    transition: all 0.3s;
}

.info-list-item:hover {
    background: #f0f0ed;
    transform: translateX(5px);
    box-shadow: 0 2px 6px rgba(107, 124, 94, 0.15);
}

p, span, label {
    color: #4a4a48;
}

h1, h2, h3, h4, h5, h6 {
    color: #4a5c3e;
}
</style>
""", unsafe_allow_html=True)

# ========================================
# データベース関数
# ========================================
def get_available_tables():
    """Supabaseの全テーブルを自動検出（高速版）"""
    try:
        import requests
        import json
        
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}'
        }
        
        try:
            response = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
            if response.status_code == 200:
                data = response.json()
                if 'definitions' in data:
                    tables = [key for key in data['definitions'].keys() if not key.startswith('_')]
                    return sorted(tables)
                elif 'paths' in data:
                    tables = []
                    for path in data['paths'].keys():
                        if path.startswith('/'):
                            table_name = path.strip('/').split('?')[0]
                            if table_name and not table_name.startswith('rpc'):
                                tables.append(table_name)
                    return sorted(list(set(tables)))
        except:
            pass
        
        possible_tables = set()
        
        prefixes = ['t_', 'T_', 'm_', 'M_', 'tbl_', 'v_', 'V_']
        
        keywords = [
            'machine', 'Machine', 'MACHINE',
            'code', 'Code', 'CODE',
            'unit', 'Unit', 'UNIT',
            'unitcode', 'Unitcode', 'UNITCODE',
            'machinecode', 'MachineCode', 'MACHINECODE',
            'machineunit', 'MachineUnit', 'MACHINEUNIT',
            'machineunitcode', 'MachineUnitCode', 'MACHINEUNITCODE',
            'expense', 'Expense', 'EXPENSE',
            'order', 'Order', 'ORDER',
            'accept', 'Accept', 'ACCEPT',
            'acceptorder', 'AcceptOrder', 'ACCEPTORDER',
            'purchase', 'Purchase', 'PURCHASE',
            'delivery', 'Delivery', 'DELIVERY',
            'user', 'User', 'USER', 'users', 'Users', 'USERS',
            'product', 'Product', 'PRODUCT', 'products', 'Products', 'PRODUCTS',
            'customer', 'Customer', 'CUSTOMER', 'customers', 'Customers', 'CUSTOMERS',
            'item', 'Item', 'ITEM', 'items', 'Items', 'ITEMS',
        ]
        
        for prefix in prefixes:
            for keyword in keywords:
                possible_tables.add(f"{prefix}{keyword}")
        
        possible_tables.update(keywords)
        
        found_tables = []
        for table in sorted(possible_tables):
            try:
                result = supabase.table(table).select("id").limit(1).execute()
                found_tables.append(table)
            except:
                pass
        
        return sorted(found_tables) if found_tables else []
        
    except Exception as e:
        print(f"Error getting tables: {e}")
        return []

def get_table_columns(table_name):
    """テーブルのカラム一覧を取得"""
    try:
        response = supabase.table(table_name).select("*").limit(1).execute()
        if response.data and len(response.data) > 0:
            return list(response.data[0].keys())
        else:
            try:
                response2 = supabase.table(table_name).select("*").limit(0).execute()
                if hasattr(response2, 'data'):
                    return []
            except:
                pass
        return []
    except Exception as e:
        print(f"Error getting columns for {table_name}: {e}")
        return []

def get_table_data(table_name, limit=1000):
    try:
        response = supabase.table(table_name).select("*").limit(limit).execute()
        if response.data:
            return pd.DataFrame(response.data)
        return pd.DataFrame()
    except:
        return pd.DataFrame()

def get_table_count(table_name):
    try:
        response = supabase.table(table_name).select("*", count="exact").execute()
        return response.count if hasattr(response, 'count') else len(response.data)
    except:
        return 0

def create_table_sql(table_name, columns):
    """テーブル作成用のSQLを生成"""
    column_defs = []
    
    column_defs.append("id BIGSERIAL PRIMARY KEY")
    
    for col in columns:
        col_name = col['name']
        col_type = col['type']
        nullable = col.get('nullable', True)
        default = col.get('default', None)
        
        type_map = {
            'テキスト': 'TEXT',
            '整数': 'INTEGER',
            '小数': 'NUMERIC',
            '真偽値': 'BOOLEAN',
            '日付': 'DATE',
            '日時': 'TIMESTAMP',
            'JSON': 'JSONB'
        }
        
        sql_type = type_map.get(col_type, 'TEXT')
        col_def = f"{col_name} {sql_type}"
        
        if not nullable:
            col_def += " NOT NULL"
        
        if default:
            if sql_type in ['TEXT']:
                col_def += f" DEFAULT '{default}'"
            elif sql_type == 'BOOLEAN':
                col_def += f" DEFAULT {default}"
            else:
                col_def += f" DEFAULT {default}"
        
        column_defs.append(col_def)
    
    column_defs.append("created_at TIMESTAMP DEFAULT NOW()")
    column_defs.append("updated_at TIMESTAMP DEFAULT NOW()")
    
    sql = f"CREATE TABLE {table_name} (\n  " + ",\n  ".join(column_defs) + "\n);"
    
    return sql

def create_table_direct(table_name, columns):
    """Supabase PostgreSQLデータベースに直接テーブルを作成"""
    try:
        sql = create_table_sql(table_name, columns)
        
        try:
            import psycopg2
            conn = psycopg2.connect(DATABASE_URL)
            cur = conn.cursor()
            cur.execute(sql)
            conn.commit()
            cur.close()
            conn.close()
            return True, "✅ テーブルを作成しました！"
        except ImportError:
            return False, "❌ psycopg2がインストールされていません。'pip install psycopg2-binary'を実行してください。"
        except Exception as e:
            return False, f"❌ データベースエラー: {str(e)}"
            
    except Exception as e:
        return False, f"❌ エラー: {str(e)}"

# ========================================
# サイドバー
# ========================================
with st.sidebar:
    st.markdown("# 📊 データベース管理")
    st.markdown("---")
    
    if 'page' not in st.session_state:
        st.session_state['page'] = "🏠 ダッシュボード"
    
    page = st.radio(
        "メニュー",
        ["🏠 ダッシュボード", "🆕 テーブル作成", "📋 データ管理", "🔍 検索", "📊 集計分析", "🔧 SQL実行"],
        index=["🏠 ダッシュボード", "🆕 テーブル作成", "📋 データ管理", "🔍 検索", "📊 集計分析", "🔧 SQL実行"].index(st.session_state['page']) if st.session_state['page'] in ["🏠 ダッシュボード", "🆕 テーブル作成", "📋 データ管理", "🔍 検索", "📊 集計分析", "🔧 SQL実行"] else 0,
        label_visibility="collapsed"
    )
    
    st.session_state['page'] = page
    
    st.markdown("---")
    
    if st.button("🔄 更新", use_container_width=True):
        st.cache_data.clear()
        st.rerun()
    
    with st.spinner("テーブルを読み込み中..."):
        available_tables = get_available_tables()
    
    if available_tables:
        st.success(f"✅ {len(available_tables)}個のテーブル")
        
        with st.expander("📋 テーブル一覧", expanded=True):
            for table in available_tables:
                st.markdown(f"<span style='color: #e0e0e0;'>• {table}</span>", unsafe_allow_html=True)
    else:
        st.warning("テーブルなし")
        st.info("💡 Supabaseにテーブルを作成後、「🔄 更新」ボタンを押してください")
    
    st.markdown("---")
    
    if available_tables:
        st.markdown("### 📋 テーブル選択")
        st.caption("現在のテーブル")
        
        if len(available_tables) == 1:
            selected_table = available_tables[0]
            st.info(f"✓ {selected_table}")
        else:
            if 'selected_table' not in st.session_state or st.session_state.get('selected_table') not in available_tables:
                st.session_state['selected_table'] = available_tables[0]
            
            selected_table = st.selectbox(
                "テーブルを選ぶ",
                available_tables,
                index=available_tables.index(st.session_state['selected_table']) if st.session_state['selected_table'] in available_tables else 0,
                label_visibility="collapsed",
                key="sidebar_table_select"
            )
            st.session_state['selected_table'] = selected_table
            
            count = get_table_count(selected_table)
            st.success(f"✓ {selected_table}\n\n{count:,} レコード")
    else:
        selected_table = None
        st.warning("テーブルがありません")

# ========================================
# 🏠 ダッシュボード
# ========================================
if page == "🏠 ダッシュボード":
    st.markdown('<div class="page-title">📊 ダッシュボード</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-subtitle">データベース概要</div>', unsafe_allow_html=True)
    
    if available_tables:
        cols = st.columns(3)
        
        total_records = sum([get_table_count(t) for t in available_tables])
        
        with cols[0]:
            st.metric("総レコード数", f"{total_records:,}")
        
        with cols[1]:
            st.metric("テーブル数", f"{len(available_tables)}")
        
        with cols[2]:
            st.metric("最終更新", datetime.now().strftime("%Y/%m/%d"))
        
        st.markdown("")
        st.markdown("---")
        
        st.markdown("### 📋 テーブル一覧")
        st.caption("テーブル名をクリックしてデータを表示")
        
        for table in available_tables:
            count = get_table_count(table)
            
            col1, col2 = st.columns([3, 1])
            with col1:
                if st.button(f"📊 {table}", key=f"table_btn_{table}", use_container_width=True):
                    st.session_state['selected_table'] = table
                    st.session_state['page'] = "📋 データ管理"
                    st.rerun()
            with col2:
                st.markdown(f"**{count:,}** レコード")
    
    else:
        st.markdown("""
        <div class="info-card info-card-blue">
            <div class="card-header">
                <span>👋 ようこそ</span>
            </div>
            <p style="color:#718096;margin:0;">最初のテーブルを作成してください</p>
        </div>
        """, unsafe_allow_html=True)

# ========================================
# 🆕 テーブル作成
# ========================================
elif page == "🆕 テーブル作成":
    st.markdown('<div class="page-title">🆕 テーブル作成</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-subtitle">新しいテーブルをSupabaseに作成</div>', unsafe_allow_html=True)
    
    if 'table_columns' not in st.session_state:
        st.session_state.table_columns = []
    
    st.markdown("### 1️⃣ テーブル名を入力")
    st.caption("英数字とアンダースコアのみ使用できます（例: users, order_items, t_products）")
    
    table_name = st.text_input(
        "テーブル名",
        placeholder="例: users",
        help="小文字の英数字とアンダースコアで入力してください",
        label_visibility="collapsed"
    )
    
    if table_name:
        pattern = "^[a-z][a-z0-9_]*$"
        if not re.match(pattern, table_name):
            st.error("❌ テーブル名は小文字の英字で始まり、英数字とアンダースコアのみ使用できます")
            table_name = None
    
    st.markdown("---")
    
    st.markdown("### 2️⃣ カラム（項目）を追加")
    st.caption("テーブルに必要な項目を追加してください。id, created_at, updated_atは自動で追加されます。")
    
    with st.expander("➕ カラムを追加", expanded=True):
        col1, col2, col3, col4, col5 = st.columns([3, 2, 1, 2, 1])
        
        with col1:
            col_name = st.text_input(
                "カラム名",
                placeholder="例: name, email, price",
                help="英数字とアンダースコアのみ",
                key="new_col_name"
            )
        
        with col2:
            col_type = st.selectbox(
                "データ型",
                ["テキスト", "整数", "小数", "真偽値", "日付", "日時", "JSON"],
                key="new_col_type"
            )
        
        with col3:
            col_nullable = st.checkbox("NULL許可", value=True, key="new_col_nullable")
        
        with col4:
            col_default = st.text_input(
                "デフォルト値",
                placeholder="省略可",
                key="new_col_default"
            )
        
        with col5:
            st.write("")
            st.write("")
            if st.button("➕", key="add_column_btn"):
                if col_name:
                    pattern = "^[a-z][a-z0-9_]*$"
                    if not re.match(pattern, col_name):
                        st.error("カラム名は小文字の英字で始まり、英数字とアンダースコアのみ使用できます")
                    elif col_name in ['id', 'created_at', 'updated_at']:
                        st.error("id, created_at, updated_atは予約語です")
                    elif any(c['name'] == col_name for c in st.session_state.table_columns):
                        st.error("同じカラム名が既に存在します")
                    else:
                        st.session_state.table_columns.append({
                            'name': col_name,
                            'type': col_type,
                            'nullable': col_nullable,
                            'default': col_default if col_default else None
                        })
                        st.rerun()
                else:
                    st.error("カラム名を入力してください")
    
    if st.session_state.table_columns:
        st.markdown("### 📋 追加されたカラム")
        
        st.info("💡 以下のカラムに加えて、id（主キー）、created_at、updated_atが自動で追加されます")
        
        for idx, col in enumerate(st.session_state.table_columns):
            col1, col2 = st.columns([9, 1])
            with col1:
                nullable_text = "NULL許可" if col['nullable'] else "必須"
                default_text = f"、デフォルト値: {col['default']}" if col['default'] else ""
                st.success(f"✓ **{col['name']}** ({col['type']}, {nullable_text}{default_text})")
            with col2:
                if st.button("❌", key=f"del_col_{idx}"):
                    st.session_state.table_columns.pop(idx)
                    st.rerun()
    
    st.markdown("---")
    
    if table_name and st.session_state.table_columns:
        st.markdown("### 🔧 生成されるSQL")
        sql = create_table_sql(table_name, st.session_state.table_columns)
        
        with st.expander("📝 SQLを表示", expanded=False):
            st.code(sql, language="sql")
        
        st.markdown("---")
        
        col1, col2, col3 = st.columns([2, 2, 1])
        
        with col1:
            if st.button("🚀 テーブルを作成する", type="primary", use_container_width=True, key="create_table_btn"):
                with st.spinner("テーブルを作成中..."):
                    result = create_table_direct(table_name, st.session_state.table_columns)
                    
                    if result[0] == True:
                        st.success(result[1])
                        st.balloons()
                        st.info("💡 サイドバーの「🔄 更新」ボタンを押して新しいテーブルを表示してください")
                        
                        if st.button("✅ 完了（リセット）", use_container_width=True):
                            st.session_state.table_columns = []
                            st.cache_data.clear()
                            st.rerun()
                    else:
                        st.error(result[1])
                        st.info("SQLを手動で実行してください")
                        st.code(sql, language="sql")
                        
                        st.download_button(
                            "📋 SQLをダウンロード",
                            sql.encode('utf-8'),
                            f"create_{table_name}.sql",
                            "text/plain;charset=utf-8",
                            use_container_width=True
                        )
        
        with col2:
            if st.button("🔄 リセット", use_container_width=True):
                st.session_state.table_columns = []
                st.rerun()
        
        with col3:
            pass
    
    elif table_name and not st.session_state.table_columns:
        st.warning("⚠️ カラムを追加してください")
    elif not table_name and st.session_state.table_columns:
        st.warning("⚠️ テーブル名を入力してください")
    else:
        st.info("👆 テーブル名を入力してカラムを追加してください")
    
    with st.expander("💡 使い方のヒント"):
        st.markdown("""
        ### データ型の説明
        - **テキスト**: 文字列データ（名前、説明など）
        - **整数**: 整数（年齢、個数など）
        - **小数**: 小数点を含む数値（価格、割合など）
        - **真偽値**: true/false（フラグ、有効/無効など）
        - **日付**: 日付のみ（2025-01-15）
        - **日時**: 日付と時刻（2025-01-15 10:30:00）
        - **JSON**: JSON形式のデータ
        
        ### よくあるテーブルの例
        
        **ユーザーテーブル (users)**
        - name (テキスト, 必須)
        - email (テキスト, 必須)
        - age (整数, NULL許可)
        
        **商品テーブル (products)**
        - name (テキスト, 必須)
        - price (小数, 必須)
        - stock (整数, デフォルト値: 0)
        - is_active (真偽値, デフォルト値: true)
        
        **注文テーブル (orders)**
        - order_number (テキスト, 必須)
        - customer_name (テキスト, 必須)
        - total_amount (小数, 必須)
        - order_date (日付, 必須)
        """)
    
    st.markdown("---")
    
    with st.expander("⚡ テンプレートから作成"):
        st.markdown("### よく使うテーブルのテンプレート")
        
        template_col1, template_col2 = st.columns(2)
        
        with template_col1:
            if st.button("👥 ユーザーテーブル", use_container_width=True):
                st.session_state.table_columns = [
                    {'name': 'name', 'type': 'テキスト', 'nullable': False, 'default': None},
                    {'name': 'email', 'type': 'テキスト', 'nullable': False, 'default': None},
                    {'name': 'age', 'type': '整数', 'nullable': True, 'default': None},
                    {'name': 'is_active', 'type': '真偽値', 'nullable': False, 'default': 'true'},
                ]
                st.rerun()
            
            if st.button("📦 商品テーブル", use_container_width=True):
                st.session_state.table_columns = [
                    {'name': 'name', 'type': 'テキスト', 'nullable': False, 'default': None},
                    {'name': 'description', 'type': 'テキスト', 'nullable': True, 'default': None},
                    {'name': 'price', 'type': '小数', 'nullable': False, 'default': None},
                    {'name': 'stock', 'type': '整数', 'nullable': False, 'default': '0'},
                    {'name': 'is_active', 'type': '真偽値', 'nullable': False, 'default': 'true'},
                ]
                st.rerun()
        
        with template_col2:
            if st.button("📋 注文テーブル", use_container_width=True):
                st.session_state.table_columns = [
                    {'name': 'order_number', 'type': 'テキスト', 'nullable': False, 'default': None},
                    {'name': 'customer_name', 'type': 'テキスト', 'nullable': False, 'default': None},
                    {'name': 'total_amount', 'type': '小数', 'nullable': False, 'default': None},
                    {'name': 'order_date', 'type': '日付', 'nullable': False, 'default': None},
                    {'name': 'status', 'type': 'テキスト', 'nullable': False, 'default': 'pending'},
                ]
                st.rerun()
            
            if st.button("🏢 会社テーブル", use_container_width=True):
                st.session_state.table_columns = [
                    {'name': 'company_name', 'type': 'テキスト', 'nullable': False, 'default': None},
                    {'name': 'address', 'type': 'テキスト', 'nullable': True, 'default': None},
                    {'name': 'phone', 'type': 'テキスト', 'nullable': True, 'default': None},
                    {'name': 'email', 'type': 'テキスト', 'nullable': True, 'default': None},
                ]
                st.rerun()

# ========================================
# 📋 データ管理
# ========================================
elif page == "📋 データ管理":
    st.markdown('<div class="page-title">📋 データ管理</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-subtitle">レコードの表示・追加・編集・削除</div>', unsafe_allow_html=True)
    
    if not selected_table:
        st.warning("⚠️ サイドバーからテーブルを選択してください")
        st.stop()
    
    tab1, tab2, tab3, tab4, tab5 = st.tabs(["📋 一覧", "➕ 追加", "✏️ 編集", "🗑️ 削除", "📤 インポート"])
    
    with tab1:
        col1, col2, col3 = st.columns([2, 1, 1])
        with col1:
            st.markdown(f"### {selected_table}")
        with col2:
            limit = st.selectbox("表示件数", [100, 500, 1000], index=0)
        with col3:
            if st.button("🔄 更新", use_container_width=True):
                st.rerun()
        
        df = get_table_data(selected_table, limit)
        if df is not None and len(df) > 0:
            st.info(f"📊 {len(df):,} 件のレコード")
            st.dataframe(df, use_container_width=True, height=500, hide_index=True)
            
            csv = df.to_csv(index=False, encoding='utf-8-sig')
            st.download_button(
                "📥 CSVダウンロード",
                csv,
                f"{selected_table}_{datetime.now().strftime('%Y%m%d')}.csv",
                "text/csv",
                use_container_width=True
            )
        else:
            st.info("データがありません")
    
    with tab2:
        st.markdown("### 新しいレコードを追加")
        columns = get_table_columns(selected_table)
        
        if columns:
            with st.form("add_form", clear_on_submit=True):
                new_data = {}
                
                for col in columns:
                    if col.lower() in ['id', 'created_at', 'updated_at']:
                        continue
                    
                    if 'date' in col.lower():
                        new_data[col] = st.date_input(col)
                    elif any(word in col.lower() for word in ['price', 'amount', 'count', 'num']):
                        new_data[col] = st.number_input(col, min_value=0)
                    else:
                        new_data[col] = st.text_input(col)
                
                if st.form_submit_button("✅ レコードを追加", type="primary", use_container_width=True):
                    filtered = {k: v for k, v in new_data.items() if v not in [None, '', 0]}
                    if filtered:
                        try:
                            supabase.table(selected_table).insert(filtered).execute()
                            st.success("✅ レコードを追加しました")
                            st.rerun()
                        except Exception as e:
                            st.error(f"エラー: {e}")
        else:
            st.info("テーブルの構造を取得できませんでした")
    
    with tab3:
        st.markdown("### レコードを編集")
        
        df = get_table_data(selected_table, 1000)
        if df is not None and len(df) > 0:
            st.dataframe(df, use_container_width=True, height=250, hide_index=True)
            
            id_col = 'id' if 'id' in df.columns else df.columns[0]
            selected_id = st.selectbox("編集するIDを選択", df[id_col].tolist())
            row = df[df[id_col] == selected_id].iloc[0]
            
            with st.form("edit_form"):
                updated = {}
                
                for col in df.columns:
                    if col.lower() in ['id', 'created_at', 'updated_at']:
                        continue
                    
                    val = row[col]
                    if 'date' in col.lower():
                        try:
                            updated[col] = st.date_input(col, value=pd.to_datetime(val).date())
                        except:
                            updated[col] = st.date_input(col)
                    else:
                        updated[col] = st.text_input(col, value=str(val) if not pd.isna(val) else "")
                
                if st.form_submit_button("💾 変更を保存", type="primary", use_container_width=True):
                    try:
                        supabase.table(selected_table).update(updated).eq(id_col, selected_id).execute()
                        st.success("✅ レコードを更新しました")
                        st.rerun()
                    except Exception as e:
                        st.error(f"エラー: {e}")
        else:
            st.info("データがありません")
    
    with tab4:
        st.markdown("### レコードを削除")
        st.warning("⚠️ 削除したレコードは復元できません")
        
        df = get_table_data(selected_table, 1000)
        if df is not None and len(df) > 0:
            st.dataframe(df, use_container_width=True, height=250, hide_index=True)
            
            id_col = 'id' if 'id' in df.columns else df.columns[0]
            selected_id = st.selectbox("削除するIDを選択", df[id_col].tolist(), key="del_id")
            
            if st.button("🗑️ レコードを削除", type="primary", use_container_width=True):
                try:
                    supabase.table(selected_table).delete().eq(id_col, selected_id).execute()
                    st.success("✅ レコードを削除しました")
                    st.rerun()
                except Exception as e:
                    st.error(f"エラー: {e}")
        else:
            st.info("データがありません")
    
    with tab5:
        st.markdown("### CSVファイルをインポート")
        
        col1, col2 = st.columns([3, 1])
        with col1:
            uploaded_file = st.file_uploader("CSVファイルを選択", type=['csv'])
        with col2:
            encoding = st.selectbox(
                "文字コード",
                ["utf-8", "shift_jis", "cp932", "utf-8-sig"],
                index=1,
                help="文字化けする場合は変更してください"
            )
        
        if uploaded_file is not None:
            try:
                df_upload = pd.read_csv(uploaded_file, encoding=encoding)
                st.dataframe(df_upload.head(10), use_container_width=True, hide_index=True)
                st.caption(f"プレビュー（全{len(df_upload):,}件）")
                
                if st.button("✅ データをインポート", type="primary", use_container_width=True):
                    progress_bar = st.progress(0)
                    success = 0
                    errors = 0
                    
                    for idx, row in df_upload.iterrows():
                        try:
                            row_dict = {k: v for k, v in row.to_dict().items() 
                                      if pd.notna(v) and k not in ['id', 'created_at', 'updated_at']}
                            if row_dict:
                                supabase.table(selected_table).insert(row_dict).execute()
                                success += 1
                        except:
                            errors += 1
                        progress_bar.progress((idx + 1) / len(df_upload))
                    
                    progress_bar.empty()
                    if success > 0:
                        st.success(f"✅ {success:,}件のレコードをインポートしました")
                        if errors > 0:
                            st.warning(f"⚠️ {errors}件のエラーがありました")
                    else:
                        st.error("❌ インポートに失敗しました")
                    st.rerun()
            except UnicodeDecodeError:
                st.error("❌ 文字コードが正しくありません。右側の「文字コード」を変更してください。")
                st.info("💡 日本語のCSVファイルは通常「shift_jis」または「cp932」です")
            except Exception as e:
                st.error(f"❌ エラー: {e}")

# ========================================
# 🔍 検索
# ========================================
elif page == "🔍 検索":
    st.markdown('<div class="page-title">🔍 検索</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-subtitle">キーワードや条件でレコードを検索</div>', unsafe_allow_html=True)
    
    if not selected_table:
        st.warning("⚠️ サイドバーからテーブルを選択してください")
        st.stop()
    
    tab1, tab2 = st.tabs(["🔍 簡単検索", "🎯 詳細検索"])
    
    with tab1:
        st.markdown("### キーワードで検索")
        col1, col2 = st.columns([4, 1])
        with col1:
            search_text = st.text_input("検索キーワード", placeholder="検索したいテキストを入力", label_visibility="collapsed")
        with col2:
            search_btn = st.button("🔍 検索", type="primary", use_container_width=True)
        
        if search_btn and search_text:
            columns = get_table_columns(selected_table)
            all_results = []
            
            for col in columns:
                try:
                    response = supabase.table(selected_table).select("*").ilike(col, f"%{search_text}%").limit(100).execute()
                    if response.data:
                        all_results.extend(response.data)
                except:
                    continue
            
            if all_results:
                unique_data = []
                seen = set()
                for item in all_results:
                    key = str(item.get('id', str(item)))
                    if key not in seen:
                        seen.add(key)
                        unique_data.append(item)
                
                df = pd.DataFrame(unique_data)
                st.success(f"✅ {len(df):,}件見つかりました")
                st.dataframe(df, use_container_width=True, height=350, hide_index=True)
            else:
                st.warning("結果が見つかりませんでした")
    
    with tab2:
        st.markdown("### 複数の条件で検索")
        
        if 'search_conditions' not in st.session_state:
            st.session_state.search_conditions = []
        
        columns = get_table_columns(selected_table)
        
        col1, col2, col3, col4 = st.columns([3, 2, 3, 1])
        with col1:
            cond_col = st.selectbox("フィールド", columns, key="sc_col")
        with col2:
            cond_op = st.selectbox("演算子", ["等しい", "含む", "より大きい", "より小さい"], key="sc_op")
        with col3:
            cond_val = st.text_input("値", key="sc_val")
        with col4:
            st.write("")
            if st.button("➕"):
                if cond_val:
                    st.session_state.search_conditions.append({
                        'column': cond_col,
                        'operator': cond_op,
                        'value': cond_val
                    })
                    st.rerun()
        
        if st.session_state.search_conditions:
            st.markdown("**検索条件:**")
            for idx, cond in enumerate(st.session_state.search_conditions):
                col1, col2 = st.columns([9, 1])
                with col1:
                    st.info(f"{cond['column']} が {cond['operator']} 「{cond['value']}」")
                with col2:
                    if st.button("❌", key=f"del_{idx}"):
                        st.session_state.search_conditions.pop(idx)
                        st.rerun()
            
            if st.button("🔍 検索実行", type="primary", use_container_width=True, key="adv_search"):
                query = supabase.table(selected_table).select("*")
                
                for cond in st.session_state.search_conditions:
                    col, op, val = cond['column'], cond['operator'], cond['value']
                    
                    if op == "等しい":
                        query = query.eq(col, val)
                    elif op == "含む":
                        query = query.ilike(col, f"%{val}%")
                    elif op == "より大きい":
                        query = query.gt(col, val)
                    elif op == "より小さい":
                        query = query.lt(col, val)
                
                try:
                    response = query.limit(500).execute()
                    if response.data:
                        df = pd.DataFrame(response.data)
                        st.success(f"✅ {len(df):,}件見つかりました")
                        st.dataframe(df, use_container_width=True, height=350, hide_index=True)
                    else:
                        st.warning("結果なし")
                except Exception as e:
                    st.error(f"エラー: {e}")

# ========================================
# 📊 集計分析
# ========================================
elif page == "📊 集計分析":
    st.markdown('<div class="page-title">📊 集計分析</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-subtitle">データをグループ化して集計・分析</div>', unsafe_allow_html=True)
    
    if not selected_table:
        st.warning("⚠️ サイドバーからテーブルを選択してください")
        st.stop()
    
    columns = get_table_columns(selected_table)
    valid_columns = [c for c in columns if c not in ['id', 'created_at', 'updated_at']]
    
    st.markdown("### 1️⃣ グループ化する項目を選択")
    st.caption("同じ値をまとめて集計したい項目を選んでください（例：カテゴリー、地域、月など）")
    group_cols = st.multiselect(
        "グループ化",
        valid_columns,
        help="複数選択可能です",
        label_visibility="collapsed"
    )
    
    st.markdown("### 2️⃣ 集計方法を選択")
    
    col1, col2 = st.columns(2)
    
    with col1:
        calc_type = st.selectbox(
            "計算方法",
            ["件数を数える", "合計", "平均", "最大値", "最小値"],
            help="どのような計算を行うか選択してください"
        )
    
    with col2:
        if calc_type != "件数を数える":
            calc_col = st.selectbox(
                "計算するフィールド",
                valid_columns,
                help="数値が入っているフィールドを選択してください"
            )
        else:
            calc_col = None
            st.info("グループごとのレコード数をカウントします")
    
    st.markdown("---")
    
    if st.button("📊 集計を実行", type="primary", use_container_width=True):
        if not group_cols:
            st.warning("⚠️ グループ化する項目を選択してください")
        else:
            with st.spinner("集計中..."):
                df = get_table_data(selected_table, 10000)
                
                if df is not None and len(df) > 0:
                    try:
                        if calc_type == "件数を数える":
                            result = df.groupby(group_cols).size().reset_index(name='件数')
                        elif calc_type == "合計":
                            df[calc_col] = pd.to_numeric(df[calc_col], errors='coerce')
                            result = df.groupby(group_cols)[calc_col].sum().reset_index(name=f'{calc_col}_合計')
                        elif calc_type == "平均":
                            df[calc_col] = pd.to_numeric(df[calc_col], errors='coerce')
                            result = df.groupby(group_cols)[calc_col].mean().reset_index(name=f'{calc_col}_平均')
                        elif calc_type == "最大値":
                            df[calc_col] = pd.to_numeric(df[calc_col], errors='coerce')
                            result = df.groupby(group_cols)[calc_col].max().reset_index(name=f'{calc_col}_最大')
                        else:
                            df[calc_col] = pd.to_numeric(df[calc_col], errors='coerce')
                            result = df.groupby(group_cols)[calc_col].min().reset_index(name=f'{calc_col}_最小')
                        
                        st.success(f"✅ {len(result):,}グループの集計結果")
                        
                        st.dataframe(result, use_container_width=True, height=400, hide_index=True)
                        
                        csv = result.to_csv(index=False, encoding='utf-8-sig')
                        st.download_button(
                            "📥 CSVダウンロード",
                            csv,
                            f"{selected_table}_集計_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                            "text/csv",
                            use_container_width=True
                        )
                        
                        if len(result) <= 50 and len(result) > 0:
                            st.markdown("---")
                            st.markdown("### 📈 グラフ表示")
                            
                            try:
                                chart_data = result.set_index(group_cols[0])
                                
                                col1, col2 = st.columns(2)
                                with col1:
                                    st.markdown("**棒グラフ**")
                                    st.bar_chart(chart_data)
                                with col2:
                                    st.markdown("**折れ線グラフ**")
                                    st.line_chart(chart_data)
                            except Exception as e:
                                st.info("グラフを表示できませんでした")
                                
                    except Exception as e:
                        st.error(f"❌ エラー: {e}")
                        st.info("💡 計算するフィールドに数値以外のデータが含まれている可能性があります")
                else:
                    st.warning("データがありません")

# ========================================
# 🔧 SQL実行
# ========================================
elif page == "🔧 SQL実行":
    st.markdown('<div class="page-title">🔧 SQL実行</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-subtitle">カスタムSQLクエリを実行</div>', unsafe_allow_html=True)
    
    st.warning("⚠️ SELECT文のみ実行できます。INSERT/UPDATE/DELETEは「データ管理」ページを使用してください。")
    
    tab1, tab2, tab3 = st.tabs(["📝 クエリ実行", "📚 クエリ例", "💡 ヒント"])
    
    with tab1:
        st.markdown("### SQLクエリを入力")
        
        if 'sql_query' not in st.session_state:
            st.session_state.sql_query = ""
        
        sql_query = st.text_area(
            "SQLクエリ",
            value=st.session_state.sql_query,
            height=200,
            placeholder="例: SELECT * FROM users WHERE age > 20 ORDER BY created_at DESC LIMIT 10",
            help="SELECT文を入力してください"
        )
        
        col1, col2, col3 = st.columns([2, 2, 1])
        
        with col1:
            if st.button("▶️ クエリを実行", type="primary", use_container_width=True):
                if sql_query.strip():
                    # SELECT文のみ許可
                    if not sql_query.strip().upper().startswith('SELECT'):
                        st.error("❌ SELECT文のみ実行できます")
                    else:
                        try:
                            with st.spinner("クエリを実行中..."):
                                import psycopg2
                                conn = psycopg2.connect(DATABASE_URL)
                                cur = conn.cursor()
                                cur.execute(sql_query)
                                
                                # 結果を取得
                                rows = cur.fetchall()
                                colnames = [desc[0] for desc in cur.description]
                                
                                cur.close()
                                conn.close()
                                
                                if rows:
                                    df_result = pd.DataFrame(rows, columns=colnames)
                                    st.success(f"✅ {len(df_result):,}件のレコードを取得しました")
                                    st.dataframe(df_result, use_container_width=True, height=400, hide_index=True)
                                    
                                    # CSVダウンロード
                                    csv = df_result.to_csv(index=False, encoding='utf-8-sig')
                                    st.download_button(
                                        "📥 CSVダウンロード",
                                        csv,
                                        f"query_result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                                        "text/csv",
                                        use_container_width=True
                                    )
                                else:
                                    st.info("結果が0件でした")
                                    
                        except ImportError:
                            st.error("❌ psycopg2がインストールされていません")
                            st.code("pip install psycopg2-binary")
                        except Exception as e:
                            st.error(f"❌ エラー: {e}")
                else:
                    st.warning("⚠️ SQLクエリを入力してください")
        
        with col2:
            if st.button("🗑️ クリア", use_container_width=True):
                st.session_state.sql_query = ""
                st.rerun()
        
        with col3:
            pass
    
    with tab2:
        st.markdown("### よく使うクエリの例")
        
        st.markdown("#### 基本的なSELECT")
        query_examples = {
            "全データ取得": "SELECT * FROM テーブル名 LIMIT 100",
            "特定カラムのみ": "SELECT id, name, email FROM users",
            "条件付き検索": "SELECT * FROM products WHERE price > 1000",
            "並び替え": "SELECT * FROM orders ORDER BY created_at DESC",
            "件数制限": "SELECT * FROM customers LIMIT 10",
        }
        
        for title, query in query_examples.items():
            with st.expander(f"📌 {title}"):
                st.code(query, language="sql")
                if st.button(f"このクエリを使う", key=f"use_{title}"):
                    st.session_state.sql_query = query
                    st.rerun()
        
        st.markdown("---")
        st.markdown("#### 集計クエリ")
        
        aggregate_examples = {
            "件数カウント": "SELECT COUNT(*) as 件数 FROM users",
            "グループ化": "SELECT category, COUNT(*) as 件数 FROM products GROUP BY category",
            "合計": "SELECT SUM(price) as 合計金額 FROM orders",
            "平均": "SELECT AVG(age) as 平均年齢 FROM users WHERE age IS NOT NULL",
            "最大・最小": "SELECT MAX(price) as 最高額, MIN(price) as 最低額 FROM products",
        }
        
        for title, query in aggregate_examples.items():
            with st.expander(f"📊 {title}"):
                st.code(query, language="sql")
                if st.button(f"このクエリを使う", key=f"use_agg_{title}"):
                    st.session_state.sql_query = query
                    st.rerun()
        
        st.markdown("---")
        st.markdown("#### JOIN（結合）")
        
        join_examples = {
            "INNER JOIN": """SELECT 
    orders.id, 
    orders.order_number, 
    customers.name as customer_name
FROM orders
INNER JOIN customers ON orders.customer_id = customers.id
LIMIT 100""",
            "LEFT JOIN": """SELECT 
    products.name, 
    categories.name as category_name
FROM products
LEFT JOIN categories ON products.category_id = categories.id""",
            "複数結合": """SELECT 
    orders.order_number,
    customers.name as customer_name,
    products.name as product_name
FROM orders
INNER JOIN customers ON orders.customer_id = customers.id
INNER JOIN products ON orders.product_id = products.id"""
        }
        
        for title, query in join_examples.items():
            with st.expander(f"🔗 {title}"):
                st.code(query, language="sql")
                if st.button(f"このクエリを使う", key=f"use_join_{title}"):
                    st.session_state.sql_query = query
                    st.rerun()
    
    with tab3:
        st.markdown("### 💡 SQLクエリのヒント")
        
        st.markdown("""
        #### 基本構文
        ```sql
        SELECT カラム名
        FROM テーブル名
        WHERE 条件
        ORDER BY 並び順
        LIMIT 件数
        ```
        
        #### WHERE句の条件
        - **等しい**: `WHERE name = '太郎'`
        - **含む**: `WHERE name LIKE '%太郎%'`
        - **以上/以下**: `WHERE age >= 20`
        - **NULL判定**: `WHERE email IS NULL`
        - **複数条件**: `WHERE age > 20 AND city = '東京'`
        - **OR条件**: `WHERE city = '東京' OR city = '大阪'`
        
        #### ORDER BY（並び替え）
        - **昇順**: `ORDER BY created_at ASC`
        - **降順**: `ORDER BY created_at DESC`
        - **複数**: `ORDER BY category, price DESC`
        
        #### 集計関数
        - **COUNT()**: 件数を数える
        - **SUM()**: 合計
        - **AVG()**: 平均
        - **MAX()**: 最大値
        - **MIN()**: 最小値
        
        #### GROUP BY（グループ化）
        ```sql
        SELECT category, COUNT(*) as 件数, AVG(price) as 平均価格
        FROM products
        GROUP BY category
        ```
        
        #### 日付の検索
        - **今日**: `WHERE DATE(created_at) = CURRENT_DATE`
        - **範囲**: `WHERE created_at BETWEEN '2025-01-01' AND '2025-12-31'`
        - **今月**: `WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)`
        
        #### パフォーマンス
        - 大量データを扱う場合は必ず `LIMIT` を指定
        - インデックスが設定されたカラムで検索
        - 必要なカラムのみ取得（`SELECT *` を避ける）
        """)
        
        st.markdown("---")
        
        st.info("""
        **💡 テーブル一覧とカラムを確認する方法**
        
        サイドバーの「📋 テーブル一覧」でテーブル名を確認できます。
        各テーブルのカラムは「📋 データ管理」タブの「一覧」で確認できます。
        """)
