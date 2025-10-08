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
    page_title="データベース管理", 
    layout="wide", 
    page_icon="📊",
    initial_sidebar_state="expanded"
)

# 洗練されたCSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
        font-family: 'Inter', sans-serif;
    }
    
    .main {
        background-color: #fafbfc;
        padding: 2rem 3rem;
    }
    
    /* サイドバー */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%);
        padding: 0;
    }
    
    [data-testid="stSidebar"] * {
        color: white !important;
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
        background: rgba(255,255,255,0.1);
        padding: 0.75rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
    }
    
    [data-testid="stSidebar"] .stRadio > div > label:hover {
        background: rgba(255,255,255,0.2);
        transform: translateX(5px);
    }
    
    [data-testid="stSidebar"] .stRadio > div > label[data-checked="true"] {
        background: rgba(255,255,255,0.25);
        border-left: 4px solid white;
        font-weight: 600;
    }
    
    /* メトリクスカード */
    [data-testid="stMetric"] {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    [data-testid="stMetricValue"] {
        font-size: 36px;
        font-weight: 700;
        color: #1e40af;
    }
    
    [data-testid="stMetricLabel"] {
        font-size: 14px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    /* ボタン */
    .stButton > button {
        border-radius: 8px;
        height: 44px;
        font-weight: 600;
        font-size: 15px;
        border: none;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        transition: all 0.3s;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }
    
    .stButton > button:hover {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        transform: translateY(-2px);
    }
    
    /* データテーブル */
    .dataframe {
        border-radius: 12px;
        border: none;
        font-size: 14px;
        background: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    
    /* カード */
    .info-card {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        border: 1px solid #e2e8f0;
        transition: all 0.3s;
    }
    
    .info-card:hover {
        box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        transform: translateY(-2px);
    }
    
    .info-card-blue {
        border-top: 4px solid #3b82f6;
    }
    
    .info-card-orange {
        border-top: 4px solid #f59e0b;
    }
    
    .info-card-green {
        border-top: 4px solid #10b981;
    }
    
    .card-header {
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .card-header-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
    }
    
    /* タイトル */
    .page-title {
        font-size: 32px;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 0.5rem;
    }
    
    .page-subtitle {
        font-size: 16px;
        color: #64748b;
        margin-bottom: 2rem;
    }
    
    /* 情報リスト */
    .info-list-item {
        padding: 1rem 1.25rem;
        margin: 0.75rem 0;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 10px;
        border-left: 4px solid #3b82f6;
        font-size: 15px;
        transition: all 0.2s;
    }
    
    .info-list-item:hover {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        transform: translateX(5px);
    }
    
    /* タブ */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background-color: transparent;
        border-bottom: 2px solid #e2e8f0;
    }
    
    .stTabs [data-baseweb="tab"] {
        background-color: transparent;
        border-radius: 8px 8px 0 0;
        padding: 12px 24px;
        font-weight: 600;
        font-size: 15px;
        border: none;
        color: #64748b;
    }
    
    .stTabs [aria-selected="true"] {
        background: white;
        color: #3b82f6;
        border-bottom: 3px solid #3b82f6;
    }
    
    /* エクスパンダー */
    .streamlit-expanderHeader {
        background: white;
        border-radius: 10px;
        font-weight: 600;
        font-size: 16px;
        border: 1px solid #e2e8f0;
    }
</style>
""", unsafe_allow_html=True)

# ========================================
# データベース関数
# ========================================
def get_available_tables():
    try:
        known_tables = ['t_machinecode']
        existing = []
        for table in known_tables:
            try:
                supabase.table(table).select("*").limit(1).execute()
                existing.append(table)
            except:
                pass
        return existing
    except:
        return []

def get_table_columns(table_name):
    try:
        response = supabase.table(table_name).select("*").limit(1).execute()
        if response.data and len(response.data) > 0:
            return list(response.data[0].keys())
        return []
    except:
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

def build_sql_query(config):
    """SQLクエリを生成"""
    sql_parts = []
    
    if config['select_fields']:
        fields = ', '.join([f"{f['table']}.{f['field']} AS {f['alias']}" if f.get('alias') else f"{f['table']}.{f['field']}" 
                           for f in config['select_fields']])
        sql_parts.append(f"SELECT {fields}")
    else:
        sql_parts.append("SELECT *")
    
    sql_parts.append(f"FROM {config['from_table']}")
    
    for join in config.get('joins', []):
        join_type = join['type'].upper()
        sql_parts.append(f"{join_type} JOIN {join['table']}")
        sql_parts.append(f"  ON {join['on_condition']}")
    
    if config.get('where_conditions'):
        conditions = []
        for cond in config['where_conditions']:
            field = f"{cond['table']}.{cond['field']}" if cond.get('table') else cond['field']
            
            if cond['operator'] == '=':
                conditions.append(f"{field} = '{cond['value']}'")
            elif cond['operator'] == 'IS NULL':
                conditions.append(f"{field} IS NULL")
            elif cond['operator'] == 'IS NOT NULL':
                conditions.append(f"{field} IS NOT NULL")
            elif cond['operator'] == '<=':
                conditions.append(f"{field} <= '{cond['value']}'")
            elif cond['operator'] == '>=':
                conditions.append(f"{field} >= '{cond['value']}'")
            elif cond['operator'] == 'LIKE':
                conditions.append(f"{field} LIKE '%{cond['value']}%'")
        
        if conditions:
            sql_parts.append(f"WHERE {' AND '.join(conditions)}")
    
    if config.get('order_by'):
        sql_parts.append(f"ORDER BY {config['order_by']}")
    
    if config.get('limit'):
        sql_parts.append(f"LIMIT {config['limit']}")
    
    return '\n'.join(sql_parts)

# ========================================
# サイドバー
# ========================================
with st.sidebar:
    st.markdown("# 📊 データベース管理")
    st.markdown("---")
    
    page = st.radio(
        "メニュー",
        ["🏠 ダッシュボード", "📋 データ管理", "🔍 検索", "📊 集計分析", "🔧 SQLビルダー"],
        label_visibility="collapsed"
    )
    
    st.markdown("---")
    
    # テーブル再読込ボタン
    col1, col2 = st.columns(2)
    with col1:
        if st.button("🔄 更新", use_container_width=True):
            st.cache_data.clear()  # キャッシュをクリア
            st.rerun()
    with col2:
        if st.button("🔍 再検索", use_container_width=True, help="より詳細にテーブルを検索"):
            st.cache_data.clear()
            st.session_state.force_refresh = True
            st.rerun()
    
    with st.spinner("テーブルを読み込み中..."):
        available_tables = get_available_tables()
    
    if available_tables:
        st.success(f"✅ {len(available_tables)}個")
        
        # テーブル一覧を表示
        with st.expander("📋 テーブル一覧", expanded=True):
            for table in available_tables:
                st.caption(f"• {table}")
    else:
        st.warning("テーブルなし")
        st.info("💡 Supabaseにテーブルを作成後、「🔍 再検索」ボタンを押してください")
    
    st.markdown("---")
    
    # テーブル選択
    if available_tables:
        if len(available_tables) == 1:
            selected_table = available_tables[0]
            st.info(f"選択中: {selected_table}")
        else:
            selected_table = st.selectbox(
                "テーブル選択",
                available_tables,
                label_visibility="collapsed"
            )
    else:
        selected_table = None

# ========================================
# 🏠 ダッシュボード
# ========================================
if page == "🏠 ダッシュボード":
    st.markdown('<div class="page-title">📊 ダッシュボード</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-subtitle">データベース概要</div>', unsafe_allow_html=True)
    
    if available_tables:
        # サマリーカード
        cols = st.columns(3)
        
        total_records = sum([get_table_count(t) for t in available_tables])
        
        with cols[0]:
            st.metric("総レコード数", f"{total_records:,}")
        
        with cols[1]:
            st.metric("テーブル数", f"{len(available_tables)}")
        
        with cols[2]:
            st.metric("最終更新", datetime.now().strftime("%Y/%m/%d"))
        
        st.markdown("")
        
        # カード型レイアウト
        col1, col2 = st.columns([1, 1])
        
        with col1:
            # テーブル一覧カード
            st.markdown("""
            <div class="info-card info-card-blue">
                <div class="card-header">
                    <span class="card-header-icon" style="background:#3182ce;color:white;">📊</span>
                    <span>テーブル一覧</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            for table in available_tables:
                count = get_table_count(table)
                with st.container():
                    st.markdown(f"""
                    <div class="info-list-item">
                        <strong>{table}</strong><br>
                        <small style="color:#718096;">{count:,} レコード</small>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    col_a, col_b = st.columns(2)
                    with col_a:
                        if st.button("📋 データ表示", key=f"data_{table}", use_container_width=True):
                            st.session_state.goto_page = "📋 データ管理"
                            st.rerun()
                    with col_b:
                        if st.button("🔍 検索", key=f"search_{table}", use_container_width=True):
                            st.session_state.goto_page = "🔍 検索"
                            st.rerun()
        
        with col2:
            # 最近の更新カード
            st.markdown("""
            <div class="info-card info-card-orange">
                <div class="card-header">
                    <span class="card-header-icon" style="background:#ed8936;color:white;">📰</span>
                    <span>最近のデータ</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            for table in available_tables:
                df = get_table_data(table, 5)
                if df is not None and len(df) > 0:
                    st.markdown(f"**{table}** の最新データ")
                    st.dataframe(df, use_container_width=True, hide_index=True, height=150)
                    st.markdown("")
            
            # クイックアクションカード
            st.markdown("""
            <div class="info-card info-card-green">
                <div class="card-header">
                    <span class="card-header-icon" style="background:#48bb78;color:white;">⚡</span>
                    <span>クイックアクション</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            if st.button("🔧 SQLビルダーを開く", use_container_width=True):
                st.session_state.goto_page = "🔧 SQLビルダー"
                st.rerun()
            
            if st.button("📊 集計分析を開く", use_container_width=True):
                st.session_state.goto_page = "📊 集計分析"
                st.rerun()
    
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
        
        # エンコーディング選択
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
                # 選択したエンコーディングで読み込み
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
        search_text = st.text_input("検索キーワード", placeholder="検索したいテキストを入力", label_visibility="collapsed")
        
        if st.button("🔍 検索", type="primary", use_container_width=True):
            if search_text:
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
                    st.dataframe(df, use_container_width=True, height=500, hide_index=True)
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
                        st.dataframe(df, use_container_width=True, height=500, hide_index=True)
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
                        
                        # 結果表示
                        st.dataframe(result, use_container_width=True, height=400, hide_index=True)
                        
                        # ダウンロード
                        csv = result.to_csv(index=False, encoding='utf-8-sig')
                        st.download_button(
                            "📥 CSVダウンロード",
                            csv,
                            f"{selected_table}_集計_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                            "text/csv",
                            use_container_width=True
                        )
                        
                        # グラフ表示
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
# 🔧 SQLビルダー
# ========================================
elif page == "🔧 SQLビルダー":
    st.markdown('<div class="page-title">🔧 SQLビルダー</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-subtitle">質問に答えるだけでSQLクエリを自動作成</div>', unsafe_allow_html=True)
    
    # セッション状態の初期化
    if 'sql_config' not in st.session_state:
        st.session_state.sql_config = {
            'from_table': '',
            'select_fields': [],
            'joins': [],
            'where_conditions': [],
            'order_by': '',
            'limit': 100
        }
    
    config = st.session_state.sql_config
    
    # ステップ形式のUI
    st.markdown("### ステップ1: どのテーブルのデータを見たいですか？")
    
    col1, col2 = st.columns([3, 1])
    with col1:
        if available_tables:
            table_options = ["手動入力"] + available_tables
            table_choice = st.selectbox("テーブルを選択", table_options, label_visibility="collapsed")
            
            if table_choice == "手動入力":
                config['from_table'] = st.text_input("テーブル名を入力", value=config['from_table'], placeholder="例: T_Expense", label_visibility="collapsed")
            else:
                config['from_table'] = table_choice
        else:
            config['from_table'] = st.text_input("テーブル名を入力", placeholder="例: T_Expense", label_visibility="collapsed")
    
    with col2:
        st.metric("選択中", config['from_table'] if config['from_table'] else "-")
    
    if not config['from_table']:
        st.info("👆 まずテーブル名を入力してください")
        st.stop()
    
    st.markdown("---")
    
    # ステップ2: フィールド選択（オプション）
    st.markdown("### ステップ2: どの項目を見たいですか？（省略可）")
    st.caption("空欄の場合は全ての項目を表示します")
    
    with st.expander("✏️ 表示する項目を指定する", expanded=len(config['select_fields']) > 0):
        col1, col2, col3 = st.columns([4, 4, 2])
        with col1:
            sel_field = st.text_input("項目名", key="sel_field", placeholder="例: PurchaseNo")
        with col2:
            sel_alias = st.text_input("表示名（変更する場合）", key="sel_alias", placeholder="例: 注文番号")
        with col3:
            st.write("")
            st.write("")
            if st.button("➕ 追加", key="add_select"):
                if sel_field:
                    config['select_fields'].append({
                        'table': config['from_table'],
                        'field': sel_field,
                        'alias': sel_alias if sel_alias else None
                    })
                    st.rerun()
        
        if config['select_fields']:
            st.markdown("**表示する項目:**")
            for idx, field in enumerate(config['select_fields']):
                col1, col2 = st.columns([9, 1])
                with col1:
                    display = f"✓ {field['field']}"
                    if field.get('alias'):
                        display += f" → 「{field['alias']}」として表示"
                    st.success(display)
                with col2:
                    if st.button("❌", key=f"del_select_{idx}"):
                        config['select_fields'].pop(idx)
                        st.rerun()
    
    st.markdown("---")
    
    # ステップ3: 絞り込み条件
    st.markdown("### ステップ3: データを絞り込みますか？（省略可）")
    st.caption("条件を指定すると、該当するデータだけを表示します")
    
    with st.expander("🔍 絞り込み条件を追加する", expanded=len(config['where_conditions']) > 0):
        
        # わかりやすい条件入力
        condition_type = st.radio(
            "条件の種類",
            ["値で絞り込む", "空欄かどうか", "日付範囲", "キーワード検索"],
            horizontal=True,
            label_visibility="collapsed"
        )
        
        if condition_type == "値で絞り込む":
            col1, col2, col3, col4 = st.columns([3, 2, 3, 1])
            with col1:
                where_field = st.text_input("項目名", key="where_field_1", placeholder="例: DeleteFlg")
            with col2:
                where_op = st.selectbox("条件", ["と同じ", "より大きい", "より小さい", "以上", "以下"], key="where_op_1")
            with col3:
                where_val = st.text_input("値", key="where_val_1", placeholder="例: 0")
            with col4:
                st.write("")
                st.write("")
                if st.button("➕", key="add_where_1"):
                    if where_field and where_val:
                        op_map = {"と同じ": "=", "より大きい": ">", "より小さい": "<", "以上": ">=", "以下": "<="}
                        config['where_conditions'].append({
                            'table': None,
                            'field': where_field,
                            'operator': op_map[where_op],
                            'value': where_val
                        })
                        st.rerun()
        
        elif condition_type == "空欄かどうか":
            col1, col2, col3 = st.columns([4, 3, 1])
            with col1:
                where_field = st.text_input("項目名", key="where_field_2", placeholder="例: NounyuDate")
            with col2:
                null_type = st.selectbox("状態", ["空欄である", "空欄ではない"], key="null_type")
            with col3:
                st.write("")
                st.write("")
                if st.button("➕", key="add_where_2"):
                    if where_field:
                        config['where_conditions'].append({
                            'table': None,
                            'field': where_field,
                            'operator': "IS NULL" if null_type == "空欄である" else "IS NOT NULL",
                            'value': None
                        })
                        st.rerun()
        
        elif condition_type == "日付範囲":
            col1, col2, col3, col4 = st.columns([3, 3, 3, 1])
            with col1:
                where_field = st.text_input("項目名", key="where_field_3", placeholder="例: DeliveryDate")
            with col2:
                date_from = st.date_input("開始日", key="date_from")
            with col3:
                date_to = st.date_input("終了日", key="date_to")
            with col4:
                st.write("")
                st.write("")
                if st.button("➕", key="add_where_3"):
                    if where_field:
                        # 開始日の条件
                        config['where_conditions'].append({
                            'table': None,
                            'field': where_field,
                            'operator': ">=",
                            'value': date_from.strftime("%Y/%m/%d")
                        })
                        # 終了日の条件
                        config['where_conditions'].append({
                            'table': None,
                            'field': where_field,
                            'operator': "<=",
                            'value': date_to.strftime("%Y/%m/%d")
                        })
                        st.rerun()
        
        else:  # キーワード検索
            col1, col2, col3 = st.columns([4, 4, 1])
            with col1:
                where_field = st.text_input("項目名", key="where_field_4", placeholder="例: Description")
            with col2:
                where_val = st.text_input("キーワード", key="where_val_4", placeholder="例: パソコン")
            with col3:
                st.write("")
                st.write("")
                if st.button("➕", key="add_where_4"):
                    if where_field and where_val:
                        config['where_conditions'].append({
                            'table': None,
                            'field': where_field,
                            'operator': "LIKE",
                            'value': where_val
                        })
                        st.rerun()
        
        if config['where_conditions']:
            st.markdown("**設定中の条件:**")
            for idx, cond in enumerate(config['where_conditions']):
                col1, col2 = st.columns([9, 1])
                with col1:
                    if cond['operator'] in ['IS NULL', 'IS NOT NULL']:
                        text = f"✓ 「{cond['field']}」が {cond['operator'].replace('IS NULL', '空欄').replace('IS NOT NULL', '空欄ではない')}"
                    elif cond['operator'] == 'LIKE':
                        text = f"✓ 「{cond['field']}」に「{cond['value']}」を含む"
                    else:
                        text = f"✓ 「{cond['field']}」が {cond['operator']} {cond['value']}"
                    st.info(text)
                with col2:
                    if st.button("❌", key=f"del_where_{idx}"):
                        config['where_conditions'].pop(idx)
                        st.rerun()
    
    st.markdown("---")
    
    # ステップ4: 並び替え
    st.markdown("### ステップ4: 並び替えますか？（省略可）")
    
    with st.expander("📊 並び替え設定", expanded=bool(config.get('order_by'))):
        col1, col2 = st.columns(2)
        with col1:
            order_field = st.text_input("並び替える項目", placeholder="例: DeliveryDate")
        with col2:
            order_dir = st.selectbox("順序", ["昇順（小→大）", "降順（大→小）"])
        
        if order_field:
            config['order_by'] = f"{order_field} {'ASC' if '昇順' in order_dir else 'DESC'}"
            st.success(f"✓ 「{order_field}」で{order_dir.split('（')[0]}に並び替え")
    
    # ステップ5: 件数制限
    st.markdown("### ステップ5: 何件表示しますか？")
    config['limit'] = st.slider("表示件数", 10, 1000, config['limit'], step=10)
    
    st.markdown("---")
    
    # 生成されたSQL
    st.markdown('<div class="section-header">📝 生成されたSQL</div>', unsafe_allow_html=True)
    
    sql = build_sql_query(config)
    st.code(sql, language="sql")
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        sql_bytes = sql.encode('utf-8')
        st.download_button(
            "📥 SQLダウンロード",
            sql_bytes,
            f"query_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql",
            "text/plain;charset=utf-8",
            use_container_width=True
        )
    
    with col2:
        if st.button("📋 コピー用", use_container_width=True):
            st.session_state.show_copy = True
    
    with col3:
        if st.button("▶️ 実行", type="primary", use_container_width=True):
            st.session_state.execute_query = True
    
    with col4:
        if st.button("🔄 最初から", use_container_width=True):
            st.session_state.sql_config = {
                'from_table': '',
                'select_fields': [],
                'joins': [],
                'where_conditions': [],
                'order_by': '',
                'limit': 100
            }
            st.session_state.execute_query = False
            st.session_state.show_copy = False
            st.rerun()
    
    if st.session_state.get('show_copy', False):
        st.text_area("コピー用SQL", sql, height=150)
    
    # クエリ実行結果
    if st.session_state.get('execute_query', False):
        st.markdown("---")
        st.markdown('<div class="section-header">📊 実行結果</div>', unsafe_allow_html=True)
        
        try:
            with st.spinner("データを取得中..."):
                query = supabase.table(config['from_table']).select("*")
                
                for cond in config.get('where_conditions', []):
                    field = cond['field']
                    op = cond['operator']
                    val = cond.get('value')
                    
                    if op == '=':
                        query = query.eq(field, val)
                    elif op == 'IS NULL':
                        query = query.is_(field, 'null')
                    elif op == 'IS NOT NULL':
                        query = query.not_.is_(field, 'null')
                    elif op == '<=':
                        query = query.lte(field, val)
                    elif op == '>=':
                        query = query.gte(field, val)
                    elif op == '>':
                        query = query.gt(field, val)
                    elif op == '<':
                        query = query.lt(field, val)
                    elif op == 'LIKE':
                        query = query.ilike(field, f"%{val}%")
                
                if config.get('limit'):
                    query = query.limit(config['limit'])
                
                response = query.execute()
                
                if response.data:
                    df_result = pd.DataFrame(response.data)
                    
                    if config['select_fields']:
                        select_cols = []
                        rename_map = {}
                        for field in config['select_fields']:
                            col_name = field['field']
                            if col_name in df_result.columns:
                                select_cols.append(col_name)
                                if field.get('alias'):
                                    rename_map[col_name] = field['alias']
                        
                        if select_cols:
                            df_result = df_result[select_cols]
                            if rename_map:
                                df_result = df_result.rename(columns=rename_map)
                    
                    if config.get('order_by'):
                        try:
                            order_parts = config['order_by'].split()
                            if len(order_parts) >= 1:
                                col_to_sort = order_parts[0]
                                ascending = True if len(order_parts) == 1 or order_parts[1].upper() != 'DESC' else False
                                if col_to_sort in df_result.columns:
                                    df_result = df_result.sort_values(by=col_to_sort, ascending=ascending)
                        except:
                            pass
                    
                    st.success(f"✅ {len(df_result):,}件のデータが見つかりました")
                    st.dataframe(df_result, use_container_width=True, height=400, hide_index=True)
                    
                    csv = df_result.to_csv(index=False, encoding='utf-8-sig')
                    st.download_button(
                        "📥 結果をCSVダウンロード",
                        csv,
                        f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                        "text/csv",
                        use_container_width=True
                    )
                else:
                    st.warning("⚠️ データが見つかりませんでした")
                    
        except Exception as e:
            st.error(f"❌ エラー: {e}")
            st.info("💡 テーブル名や項目名が正しいか確認してください")
    st.markdown('<div class="page-title">🔧 SQLビルダー</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-subtitle">ボタン操作だけで複雑なSQLクエリを作成</div>', unsafe_allow_html=True)
    
    st.info("💡 SQLの知識がなくても、複雑なクエリを簡単に作成できます。テーブルが存在しなくても、将来使用するテーブル名でSQLを生成できます。")
    
    # セッション状態の初期化
    if 'sql_config' not in st.session_state:
        st.session_state.sql_config = {
            'from_table': '',
            'select_fields': [],
            'joins': [],
            'where_conditions': [],
            'order_by': '',
            'limit': 100
        }
    
    config = st.session_state.sql_config
    
    # FROM句
    st.markdown('<div class="section-header">1️⃣ メインテーブル</div>', unsafe_allow_html=True)
    config['from_table'] = st.text_input("テーブル名", value=config['from_table'], placeholder="例: T_Expense")
    
    # SELECT句
    st.markdown('<div class="section-header">2️⃣ 取得するフィールド（項目）</div>', unsafe_allow_html=True)
    st.caption("空欄の場合は全てのフィールドを取得します")
    
    col1, col2, col3, col4 = st.columns([3, 3, 3, 1])
    with col1:
        sel_table = st.text_input("テーブル", key="sel_table", placeholder="例: T_Expense")
    with col2:
      sel_field = st.text_input("フィールド", key="sel_field_2", placeholder="例: PurchaseNo")

    with col3:
        sel_alias = st.text_input("別名（任意）", key="sel_alias", placeholder="例: 注文番号")
    with col4:
        st.write("")
        st.write("")
        if st.button("➕", key="add_select"):
            if sel_table and sel_field:
                config['select_fields'].append({
                    'table': sel_table,
                    'field': sel_field,
                    'alias': sel_alias if sel_alias else None
                })
                st.rerun()
    
    if config['select_fields']:
        st.markdown("**選択中のフィールド:**")
        for idx, field in enumerate(config['select_fields']):
            col1, col2 = st.columns([9, 1])
            with col1:
                display = f"📌 {field['table']}.{field['field']}"
                if field.get('alias'):
                    display += f" → {field['alias']}"
                st.info(display)
            with col2:
                if st.button("❌", key=f"del_select_{idx}"):
                    config['select_fields'].pop(idx)
                    st.rerun()
    
    # JOIN句
    st.markdown('<div class="section-header">3️⃣ テーブル結合（JOIN）</div>', unsafe_allow_html=True)
    st.caption("複数のテーブルのデータを組み合わせたい場合に設定します")
    
    col1, col2, col3, col4 = st.columns([2, 3, 6, 1])
    with col1:
        join_type = st.selectbox("結合タイプ", ["LEFT", "RIGHT", "INNER", "FULL"], key="join_type")
    with col2:
        join_table = st.text_input("結合テーブル", key="join_table", placeholder="例: T_AcceptOrder")
    with col3:
        join_on = st.text_input("結合条件", key="join_on", placeholder="例: T_Expense.ConstructionNo = T_AcceptOrder.ConstructNo")
    with col4:
        st.write("")
        st.write("")
        if st.button("➕", key="add_join"):
            if join_table and join_on:
                config['joins'].append({
                    'type': join_type,
                    'table': join_table,
                    'on_condition': join_on
                })
                st.rerun()
    
    if config['joins']:
        st.markdown("**結合設定:**")
        for idx, join in enumerate(config['joins']):
            col1, col2 = st.columns([9, 1])
            with col1:
                st.info(f"🔗 {join['type']} JOIN {join['table']} ON {join['on_condition']}")
            with col2:
                if st.button("❌", key=f"del_join_{idx}"):
                    config['joins'].pop(idx)
                    st.rerun()
    
    # WHERE句
    st.markdown('<div class="section-header">4️⃣ 条件（WHERE）</div>', unsafe_allow_html=True)
    st.caption("データを絞り込む条件を設定します（日付範囲、NULL判定など）")
    
    col1, col2, col3, col4, col5 = st.columns([2, 3, 2, 3, 1])
    with col1:
        where_table = st.text_input("テーブル", key="where_table", placeholder="T_Expense")
    with col2:
        where_field = st.text_input("フィールド", key="where_field", placeholder="NounyuDate")
    with col3:
        where_op = st.selectbox("演算子", ["=", "IS NULL", "IS NOT NULL", "<=", ">=", "LIKE"], key="where_op")
    with col4:
        where_val = st.text_input("値", key="where_val", placeholder="2025/8/31", disabled=(where_op in ['IS NULL', 'IS NOT NULL']))
    with col5:
        st.write("")
        st.write("")
        if st.button("➕", key="add_where"):
            if where_field:
                config['where_conditions'].append({
                    'table': where_table if where_table else None,
                    'field': where_field,
                    'operator': where_op,
                    'value': where_val if where_op not in ['IS NULL', 'IS NOT NULL'] else None
                })
                st.rerun()
    
    if config['where_conditions']:
        st.markdown("**条件設定:**")
        for idx, cond in enumerate(config['where_conditions']):
            col1, col2 = st.columns([9, 1])
            with col1:
                field_name = f"{cond['table']}.{cond['field']}" if cond.get('table') else cond['field']
                if cond['operator'] in ['IS NULL', 'IS NOT NULL']:
                    st.info(f"📍 {field_name} {cond['operator']}")
                else:
                    st.info(f"📍 {field_name} {cond['operator']} '{cond['value']}'")
            with col2:
                if st.button("❌", key=f"del_where_{idx}"):
                    config['where_conditions'].pop(idx)
                    st.rerun()
    
    # ORDER BY と LIMIT
    st.markdown('<div class="section-header">5️⃣ その他の設定</div>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        config['order_by'] = st.text_input(
            "並び替え（ORDER BY）", 
            value=config['order_by'],
            placeholder="例: T_Expense.DeliveryDate DESC"
        )
    with col2:
        config['limit'] = st.number_input("取得件数（LIMIT）", min_value=1, max_value=10000, value=config['limit'])
    
    st.markdown("---")
    
    # SQL生成と実行
    st.markdown('<div class="section-header">📝 生成されたSQL</div>', unsafe_allow_html=True)
    
    if config['from_table']:
        sql = build_sql_query(config)
        
        # SQLを見やすく表示
        st.code(sql, language="sql")
        
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            # UTF-8でエンコードしてダウンロード
            sql_bytes = sql.encode('utf-8')
            st.download_button(
                "📥 SQLをダウンロード",
                sql_bytes,
                f"query_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql",
                "text/plain;charset=utf-8",
                use_container_width=True
            )
        
        with col2:
            if st.button("📋 コピー用に表示", use_container_width=True):
                st.session_state.show_copy = True
        
        with col3:
            if st.button("▶️ クエリを実行", type="primary", use_container_width=True):
                st.session_state.execute_query = True
        
        with col4:
            if st.button("🔄 リセット", use_container_width=True):
                st.session_state.sql_config = {
                    'from_table': '',
                    'select_fields': [],
                    'joins': [],
                    'where_conditions': [],
                    'order_by': '',
                    'limit': 100
                }
                st.session_state.execute_query = False
                st.session_state.show_copy = False
                st.rerun()
        
        # コピー用表示
        if st.session_state.get('show_copy', False):
            st.text_area("コピー用SQL", sql, height=150)
        
        # クエリ実行結果
        if st.session_state.get('execute_query', False):
            st.markdown("---")
            st.markdown('<div class="section-header">📊 クエリ実行結果</div>', unsafe_allow_html=True)
            
            # Supabaseで実行可能な単純なクエリに変換
            try:
                with st.spinner("クエリを実行中..."):
                    # メインテーブルからデータ取得
                    query = supabase.table(config['from_table']).select("*")
                    
                    # WHERE条件を適用
                    for cond in config.get('where_conditions', []):
                        field = cond['field']
                        op = cond['operator']
                        val = cond.get('value')
                        
                        if op == '=':
                            query = query.eq(field, val)
                        elif op == 'IS NULL':
                            query = query.is_(field, 'null')
                        elif op == 'IS NOT NULL':
                            query = query.not_.is_(field, 'null')
                        elif op == '<=':
                            query = query.lte(field, val)
                        elif op == '>=':
                            query = query.gte(field, val)
                        elif op == 'LIKE':
                            query = query.ilike(field, f"%{val}%")
                    
                    # LIMIT適用
                    if config.get('limit'):
                        query = query.limit(config['limit'])
                    
                    # 実行
                    response = query.execute()
                    
                    if response.data:
                        df_result = pd.DataFrame(response.data)
                        
                        # SELECT句でフィールドを絞る
                        if config['select_fields']:
                            select_cols = []
                            rename_map = {}
                            for field in config['select_fields']:
                                col_name = field['field']
                                if col_name in df_result.columns:
                                    select_cols.append(col_name)
                                    if field.get('alias'):
                                        rename_map[col_name] = field['alias']
                            
                            if select_cols:
                                df_result = df_result[select_cols]
                                if rename_map:
                                    df_result = df_result.rename(columns=rename_map)
                        
                        # ORDER BY適用（簡易版）
                        if config.get('order_by'):
                            try:
                                order_parts = config['order_by'].split()
                                if len(order_parts) >= 1:
                                    col_to_sort = order_parts[0].split('.')[-1]  # テーブル名を除去
                                    ascending = True if len(order_parts) == 1 or order_parts[1].upper() != 'DESC' else False
                                    if col_to_sort in df_result.columns:
                                        df_result = df_result.sort_values(by=col_to_sort, ascending=ascending)
                            except:
                                pass
                        
                        st.success(f"✅ {len(df_result):,}件のレコードが見つかりました")
                        st.dataframe(df_result, use_container_width=True, height=400, hide_index=True)
                        
                        # ダウンロードボタン
                        csv = df_result.to_csv(index=False, encoding='utf-8-sig')
                        st.download_button(
                            "📥 結果をCSVダウンロード",
                            csv,
                            f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                            "text/csv",
                            use_container_width=True
                        )
                    else:
                        st.warning("⚠️ 結果が見つかりませんでした")
                        
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
            - フィールド: `DeliveryDate`, 演算子: `>=`, 値: `2025/4/1`
            - フィールド: `DeliveryDate`, 演算子: `<=`, 値: `2025/8/31`
            - フィールド: `DeleteFlg`, 演算子: `=`, 値: `0`
            
            **5. その他**
            - ORDER BY: `DeliveryDate ASC`
            - LIMIT: `100`
            
            **注意:** JOIN句を含む複雑なクエリは、生成されたSQLをSupabaseで直接実行してください。
            """)
    else:
        st.warning("⚠️ メインテーブル名を入力してください")
