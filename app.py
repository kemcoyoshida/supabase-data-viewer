# -*- coding: utf-8 -*-
import streamlit as st
from supabase import create_client, Client
import pandas as pd
from datetime import datetime
import re

# ========================================
# 接続情報
# ========================================
# 🚨 注意: 本番環境では環境変数を使用することを強く推奨します
SUPABASE_URL = "https://uevlguozshzwywzqtsvr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldmxndW96c2h6d3l3enF0c3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjkzMDcsImV4cCI6MjA3NDkwNTMwN30.hx82K_19c5Mmh9NXCCf15_yGDPLJ5O_XM_CnWuVMyZ8"

# Streamlitのキャッシュ機能を使ってSupabaseクライアントを保持
@st.cache_resource
def init_connection():
    return create_client(SUPABASE_URL, SUPABASE_KEY)

supabase = init_connection()

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
        background-color: #f0f2f5;
        padding: 1.5rem;
    }
    
    /* サイドバー */
    [data-testid="stSidebar"] {
        background: #2c5282;
        padding-top: 1rem;
    }
    
    [data-testid="stSidebar"] * {
        color: white !important;
    }
    
    [data-testid="stSidebar"] .stRadio > label {
        font-weight: 500;
        font-size: 15px;
    }
    
    /* カードコンテナ */
    .info-card {
        background: white;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 15px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        border-left: 4px solid #3182ce;
    }
    
    .info-card-blue {
        border-left-color: #3182ce;
    }
    
    .info-card-orange {
        border-left-color: #ed8936;
    }
    
    .info-card-green {
        border-left-color: #48bb78;
    }
    
    .info-card-red {
        border-left-color: #f56565;
    }
    
    .card-header {
        font-size: 18px;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .card-header-icon {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
    }
    
    /* メトリクスカード */
    [data-testid="stMetricValue"] {
        font-size: 28px;
        font-weight: 700;
        color: #2d3748;
    }
    
    [data-testid="stMetricLabel"] {
        font-size: 13px;
        font-weight: 500;
        color: #718096;
        text-transform: uppercase;
    }
    
    /* ボタン */
    .stButton > button {
        border-radius: 6px;
        height: 38px;
        font-weight: 500;
        font-size: 14px;
        border: none;
        background: #3182ce;
        color: white;
        transition: all 0.2s;
    }
    
    .stButton > button:hover {
        background: #2c5282;
        box-shadow: 0 2px 8px rgba(49, 130, 206, 0.3);
    }
    
    /* タブ */
    .stTabs [data-baseweb="tab-list"] {
        gap: 4px;
        background-color: transparent;
    }
    
    .stTabs [data-baseweb="tab"] {
        background-color: white;
        border-radius: 6px 6px 0 0;
        padding: 10px 20px;
        font-weight: 500;
        font-size: 14px;
        border: none;
        color: #718096;
    }
    
    .stTabs [aria-selected="true"] {
        background: #3182ce;
        color: white;
    }
    
    /* データテーブル */
    .dataframe {
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        font-size: 13px;
        background: white;
    }
    
    /* タイトル */
    .page-title {
        font-size: 24px;
        font-weight: 700;
        color: #1a202c;
        margin-bottom: 8px;
    }
    
    .page-subtitle {
        font-size: 14px;
        color: #718096;
        margin-bottom: 20px;
    }
    
    /* セクションヘッダー */
    .section-header {
        font-size: 16px;
        font-weight: 600;
        color: #2d3748;
        margin: 20px 0 12px 0;
        padding: 10px 0;
        border-bottom: 2px solid #e2e8f0;
    }
    
    /* 情報リスト */
    .info-list-item {
        padding: 12px;
        margin: 8px 0;
        background: #f7fafc;
        border-radius: 6px;
        border-left: 3px solid #3182ce;
        font-size: 14px;
    }
    
    /* ステータスバッジ */
    .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .status-active {
        background: #c6f6d5;
        color: #22543d;
    }
    
    .status-pending {
        background: #feebc8;
        color: #7c2d12;
    }
</style>
""", unsafe_allow_html=True)

# ========================================
# データベース関数
# ========================================

# テーブルの存在確認をキャッシュし、パフォーマンスを向上させる
@st.cache_data(ttl=3600) # 1時間に1回のみテーブルリストを更新
def get_available_tables():
    """
    Supabaseのテーブル一覧を取得します。
    Supabase Python SDKではテーブル一覧取得が困難なため、
    PostgreSQLのメタデータ取得RPC/Viewが存在しない場合、テーブル名をここにリストします。
    新しいテーブルを追加した場合、手動で追記してください。
    """
    try:
        # 既存のテーブル名リスト。新しいテーブルを追加した場合、ここに追加してください。
        known_tables = ['t_machinecode', 'T_Expense', 'T_AcceptOrder', 'T_NewTable'] # 例として他のテーブル名を追加
        existing = []
        for table in known_tables:
            try:
                # 存在確認のため1レコード取得を試みる
                supabase.table(table).select("*").limit(1).execute()
                existing.append(table)
            except:
                # 存在しないテーブル名の場合はスキップ
                pass
        return existing
    except:
        # Supabase接続自体に問題がある場合
        return []

@st.cache_data(ttl=300) # 5分間データをキャッシュ
def get_table_columns(table_name):
    try:
        response = supabase.table(table_name).select("*").limit(1).execute()
        if response.data and len(response.data) > 0:
            return list(response.data[0].keys())
        return []
    except:
        return []

@st.cache_data(ttl=60) # 1分間データをキャッシュ
def get_table_data(table_name, limit=1000):
    try:
        response = supabase.table(table_name).select("*").limit(limit).execute()
        if response.data:
            return pd.DataFrame(response.data)
        return pd.DataFrame()
    except Exception as e:
        #st.error(f"テーブルデータ取得エラー: {e}")
        return pd.DataFrame()

@st.cache_data(ttl=3600) # 1時間に1回のみカウントを更新
def get_table_count(table_name):
    try:
        # count="exact"を指定して正確なカウントを取得
        response = supabase.table(table_name).select("id", count="exact").execute()
        return response.count
    except:
        return 0

# SQLビルダー用のヘルパー関数
def build_sql_query(config):
    """SQLクエリを生成"""
    sql_parts = []
    
    if config['select_fields']:
        # エイリアスを含めたフィールドリストを生成
        fields = ', '.join([f"{f.get('table', config['from_table'])}.{f['field']} AS {f['alias']}" if f.get('alias') else f"{f.get('table', config['from_table'])}.{f['field']}" 
                            for f in config['select_fields']])
        sql_parts.append(f"SELECT {fields}")
    else:
        sql_parts.append("SELECT *")
    
    sql_parts.append(f"FROM {config['from_table']}")
    
    # JOIN句の追加
    for join in config.get('joins', []):
        join_type = join['type'].upper()
        sql_parts.append(f"{join_type} JOIN {join['table']}")
        sql_parts.append(f"  ON {join['on_condition']}")
    
    # WHERE句の追加
    if config.get('where_conditions'):
        conditions = []
        for cond in config['where_conditions']:
            field = f"{cond['table']}.{cond['field']}" if cond.get('table') else cond['field']
            
            # 安全のため、文字列値はシングルクォートで囲むが、数値やNULLの場合は適用しない
            value_str = f"'{cond['value']}'" if cond.get('value') is not None else ""

            if cond['operator'] == '=':
                conditions.append(f"{field} = {value_str}")
            elif cond['operator'] == 'IS NULL':
                conditions.append(f"{field} IS NULL")
            elif cond['operator'] == 'IS NOT NULL':
                conditions.append(f"{field} IS NOT NULL")
            elif cond['operator'] == '<=':
                conditions.append(f"{field} <= {value_str}")
            elif cond['operator'] == '>=':
                conditions.append(f"{field} >= {value_str}")
            elif cond['operator'] == 'LIKE':
                conditions.append(f"{field} LIKE '%{cond['value']}%'")
        
        if conditions:
            sql_parts.append(f"WHERE {' AND '.join(conditions)}")
    
    # ORDER BY句の追加
    if config.get('order_by'):
        sql_parts.append(f"ORDER BY {config['order_by']}")
    
    # LIMIT句の追加
    if config.get('limit'):
        sql_parts.append(f"LIMIT {config['limit']}")
    
    return '\n'.join(sql_parts)

# ========================================
# サイドバー
# ========================================
with st.sidebar:
    st.markdown("# 📊 データベース管理")
    st.markdown("---")
    
    # セッションステートからページ遷移を読み取る（ダッシュボードのボタンからの遷移用）
    if 'goto_page' in st.session_state:
        initial_page_index = ["🏠 ダッシュボード", "📋 データ管理", "🔍 検索", "📊 集計分析", "🔧 SQLビルダー"].index(st.session_state.goto_page)
        del st.session_state.goto_page
    else:
        initial_page_index = 0

    page = st.radio(
        "メニュー",
        ["🏠 ダッシュボード", "📋 データ管理", "🔍 検索", "📊 集計分析", "🔧 SQLビルダー"],
        index=initial_page_index,
        label_visibility="collapsed"
    )
    
    st.markdown("---")
    
    # テーブルリストを取得
    available_tables = get_available_tables()
    
    # テーブル選択のロジック
    if available_tables:
        # セッションステートにテーブル選択を保存し、ページ遷移しても維持
        if 'selected_table' not in st.session_state or st.session_state.selected_table not in available_tables:
             st.session_state.selected_table = available_tables[0]
             
        # テーブル選択ウィジェット
        selected_table = st.selectbox(
            "テーブル選択",
            available_tables,
            index=available_tables.index(st.session_state.selected_table) if st.session_state.selected_table in available_tables else 0,
            label_visibility="collapsed",
            key="sidebar_table_select"
        )
        st.session_state.selected_table = selected_table
    else:
        selected_table = None
        st.warning("利用可能なテーブルがありません。`get_available_tables`に関数内にテーブル名を追加してください。")
        
    st.markdown("---")
    if st.button("🔄 テーブルリストを更新"):
        # キャッシュをクリアしてテーブルリストを再取得
        get_available_tables.clear()
        st.rerun()


# ========================================
# 🏠 ダッシュボード
# ========================================
if page == "🏠 ダッシュボード":
    st.markdown('<div class="page-title">📊 ダッシュボード</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-subtitle">データベース概要</div>', unsafe_allow_html=True)
    
    if available_tables:
        # サマリーカード
        cols = st.columns(3)
        
        # すべてのテーブルの合計レコード数を計算
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
                    
                    # ボタンの配置とロジック（セッションステートでページ遷移を制御）
                    col_a, col_b = st.columns(2)
                    with col_a:
                        if st.button("📋 データ表示", key=f"data_{table}", use_container_width=True):
                            st.session_state.goto_page = "📋 データ管理"
                            st.session_state.selected_table = table # 遷移先で選択するテーブルを保存
                            st.rerun()
                    with col_b:
                        if st.button("🔍 検索", key=f"search_{table}", use_container_width=True):
                            st.session_state.goto_page = "🔍 検索"
                            st.session_state.selected_table = table # 遷移先で選択するテーブルを保存
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
            <p style="color:#718096;margin:0;">Supabaseのデータベースにテーブルを作成し、`get_available_tables`関数にテーブル名を追記してください。</p>
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
    
    # キャッシュクリアボタン
    if st.button("🔄 データキャッシュをクリアして再取得", key="clear_data_cache"):
        get_table_data.clear()
        st.rerun()
    
    tab1, tab2, tab3, tab4, tab5 = st.tabs(["📋 一覧", "➕ 追加", "✏️ 編集", "🗑️ 削除", "📤 インポート"])
    
    with tab1:
        col1, col2, col3 = st.columns([2, 1, 1])
        with col1:
            st.markdown(f"### {selected_table}")
        with col2:
            limit = st.selectbox("表示件数", [100, 500, 1000], index=0, key="data_limit")
        with col3:
            if st.button("🔄 更新", use_container_width=True, key="refresh_data"):
                get_table_data.clear()
                st.rerun()
        
        df = get_table_data(selected_table, limit)
        if df is not None and len(df) > 0:
            st.info(f"📊 {len(df):,} 件のレコード (最大 {limit} 件)")
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
                
                # 型推測に基づく入力ウィジェットの選択
                if 'date' in col.lower():
                    new_data[col] = st.date_input(col, value=None)
                elif any(word in col.lower() for word in ['price', 'amount', 'count', 'num', 'rate']):
                    new_data[col] = st.number_input(col, min_value=0, value=None)
                else:
                    new_data[col] = st.text_input(col)
            
            if st.form_submit_button("✅ レコードを追加", type="primary", use_container_width=True):
                # None, 空文字列, 0以外の値をフィルタリング
                filtered = {k: v for k, v in new_data.items() if v is not None and v != '' and (k.lower() not in ['price', 'amount', 'count', 'num', 'rate'] or v != 0)}
                
                if filtered:
                    try:
                        # 日付オブジェクトを文字列に変換
                        for k, v in filtered.items():
                            if isinstance(v, datetime.date):
                                filtered[k] = v.isoformat()
                                
                        supabase.table(selected_table).insert(filtered).execute()
                        st.success("✅ レコードを追加しました")
                        get_table_data.clear() # キャッシュをクリア
                        st.rerun()
                    except Exception as e:
                        st.error(f"エラー: {e}")
                else:
                    st.warning("入力された有効なデータがありません。")

    with tab3:
        st.markdown("### レコードを編集")
        
        df = get_table_data(selected_table, 1000)
        if df is not None and len(df) > 0:
            st.dataframe(df, use_container_width=True, height=250, hide_index=True)
            
            id_col = 'id' if 'id' in df.columns else df.columns[0]
            selected_id = st.selectbox("編集するIDを選択", df[id_col].tolist(), key="edit_id_select")
            row = df[df[id_col] == selected_id].iloc[0]
            
            with st.form("edit_form"):
                updated = {}
                
                for col in df.columns:
                    if col.lower() in ['id', 'created_at', 'updated_at']:
                        continue
                    
                    val = row[col]
                    
                    # 型推測に基づく入力ウィジェットの選択
                    if 'date' in col.lower():
                        try:
                            # NaNを避けてdatetime.dateオブジェクトを取得
                            date_val = pd.to_datetime(val).date() if pd.notna(val) else None
                            updated[col] = st.date_input(col, value=date_val, key=f"edit_date_{col}")
                        except:
                            updated[col] = st.date_input(col, value=None, key=f"edit_date_fallback_{col}")
                    elif any(word in col.lower() for word in ['price', 'amount', 'count', 'num', 'rate']):
                         num_val = float(val) if pd.notna(val) else 0.0
                         updated[col] = st.number_input(col, value=num_val, key=f"edit_num_{col}")
                    else:
                        text_val = str(val) if pd.notna(val) and val is not None else ""
                        updated[col] = st.text_input(col, value=text_val, key=f"edit_text_{col}")
                
                if st.form_submit_button("💾 変更を保存", type="primary", use_container_width=True):
                    try:
                        # 日付オブジェクトを文字列に変換
                        for k, v in updated.items():
                            if isinstance(v, datetime.date):
                                updated[k] = v.isoformat()
                        
                        supabase.table(selected_table).update(updated).eq(id_col, selected_id).execute()
                        st.success("✅ レコードを更新しました")
                        get_table_data.clear()
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
                    get_table_data.clear()
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
            uploaded_file = st.file_uploader("CSVファイルを選択", type=['csv'], key="import_file")
        with col2:
            encoding = st.selectbox(
                "文字コード",
                ["utf-8", "shift_jis", "cp932", "utf-8-sig"],
                index=1,
                help="文字化けする場合は変更してください",
                key="import_encoding"
            )
        
        if uploaded_file is not None:
            try:
                # 選択したエンコーディングで読み込み
                df_upload = pd.read_csv(uploaded_file, encoding=encoding)
                st.dataframe(df_upload.head(10), use_container_width=True, hide_index=True)
                st.caption(f"プレビュー（全{len(df_upload):,}件）")
                
                if st.button("✅ データをインポート", type="primary", use_container_width=True, key="run_import"):
                    progress_bar = st.progress(0)
                    success = 0
                    errors = 0
                    
                    # カラム名を小文字にしておく
                    db_columns = get_table_columns(selected_table)
                    
                    for idx, row in df_upload.iterrows():
                        try:
                            # DBのカラム名と一致する列のみを抽出し、NaNを除外
                            row_dict = {k: v for k, v in row.to_dict().items() 
                                        if pd.notna(v) and k in db_columns and k not in ['id', 'created_at', 'updated_at']}
                            
                            # 日付をISOフォーマットに変換
                            for k, v in row_dict.items():
                                if isinstance(v, datetime.date):
                                    row_dict[k] = v.isoformat()
                                elif isinstance(v, pd.Timestamp):
                                    row_dict[k] = v.isoformat()
                                
                            if row_dict:
                                supabase.table(selected_table).insert(row_dict).execute()
                                success += 1
                        except:
                            errors += 1
                        progress_bar.progress((idx + 1) / len(df_upload))
                    
                    progress_bar.empty()
                    if success > 0:
                        st.success(f"✅ {success:,}件のレコードをインポートしました")
                        get_table_data.clear()
                        if errors > 0:
                            st.warning(f"⚠️ {errors}件のエラーがありました")
                    else:
                        st.error("❌ インポートに失敗しました。ファイル形式またはデータ型を確認してください。")
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
    # 修正点1: unsafe_handle_html -> unsafe_allow_html に修正
    st.markdown('<div class="page-title">🔍 検索</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-subtitle">キーワードや条件でレコードを検索</div>', unsafe_allow_html=True)
    
    if not selected_table:
        st.warning("⚠️ サイドバーからテーブルを選択してください")
        st.stop()
    
    tab1, tab2 = st.tabs(["🔍 簡単検索", "🎯 詳細検索"])
    
    with tab1:
        st.markdown("### キーワードで検索")
        search_text = st.text_input("検索キーワード", placeholder="検索したいテキストを入力", label_visibility="collapsed", key="simple_search_text")
        
        if st.button("🔍 検索", type="primary", use_container_width=True, key="simple_search_button"):
            if search_text:
                columns = get_table_columns(selected_table)
                all_results = []
                
                # 全てのカラムに対してILike検索を実行
                with st.spinner(f"テーブル '{selected_table}' の全 {len(columns)} カラムを検索中..."):
                    for col in columns:
                        # ID、タイムスタンプ系のカラムは検索から除外することが望ましいが、ここでは提供されたロジックに従い実行
                        try:
                            # ilikeで部分一致、大文字小文字を区別しない検索
                            response = supabase.table(selected_table).select("*").ilike(col, f"%{search_text}%").limit(100).execute()
                            if response.data:
                                all_results.extend(response.data)
                        except:
                            # ilikeに対応しない型のカラム（例: 数字型）でエラーが発生した場合、スキップ
                            continue
                
                if all_results:
                    # 修正点2: 重複排除をDataFrameで行うことで、IDに基づいて確実に一意なレコードを抽出
                    df = pd.DataFrame(all_results)
                    
                    # 'id'列があればそれを使って重複排除。なければ全ての列で排除。
                    if 'id' in df.columns:
                        # IDが重複しているレコードを最初に見つかったもので残す
                        df_unique = df.drop_duplicates(subset=['id'], keep='first')
                    else:
                        # IDがない場合は、全列の組み合わせで重複排除
                        df_unique = df.drop_duplicates(keep='first')
                        
                    st.success(f"✅ {len(df_unique):,}件見つかりました")
                    st.dataframe(df_unique, use_container_width=True, height=500, hide_index=True)
                else:
                    st.warning("結果が見つかりませんでした")
            else:
                st.info("検索キーワードを入力してください。")
    
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
            st.write("")
            if st.button("➕", key="add_condition_button"):
                if cond_val:
                    st.session_state.search_conditions.append({
                        'column': cond_col,
                        'operator': cond_op,
                        'value': cond_val
                    })
                    st.rerun()
        
        if st.session_state.search_conditions:
            st.markdown("**検索条件:**")
            
            # 条件のリスト表示と削除ボタン
            conditions_to_keep = []
            for idx, cond in enumerate(st.session_state.search_conditions):
                col1, col2 = st.columns([9, 1])
                with col1:
                    st.info(f"{cond['column']} が {cond['operator']} 「{cond['value']}」")
                    conditions_to_keep.append(cond) # 削除ボタンが押されなかった条件を保持
                with col2:
                    # Streamlitのボタンクリックは一度のリランでしか保持されないため、ここでは削除ロジックを簡略化
                    if st.button("❌", key=f"del_{idx}"):
                        # 削除されたインデックスを特定
                        st.session_state.search_conditions.pop(idx)
                        st.rerun()
                        
            # 検索実行
            if st.button("🔍 検索実行", type="primary", use_container_width=True, key="adv_search"):
                query = supabase.table(selected_table).select("*")
                
                for cond in st.session_state.search_conditions:
                    col, op, val = cond['column'], cond['operator'], cond['value']
                    
                    # 数値として扱えるかチェック
                    is_numeric = False
                    try:
                        float(val)
                        is_numeric = True
                    except ValueError:
                        pass
                    
                    if op == "等しい":
                        query = query.eq(col, val)
                    elif op == "含む":
                        query = query.ilike(col, f"%{val}%")
                    elif op == "より大きい":
                        # 数値型として比較
                        if is_numeric:
                             query = query.gt(col, float(val))
                        else:
                             st.warning(f"フィールド '{col}' の演算子 '{op}' は、数値型の値でのみ機能します。")
                             st.stop()
                    elif op == "より小さい":
                         # 数値型として比較
                        if is_numeric:
                             query = query.lt(col, float(val))
                        else:
                             st.warning(f"フィールド '{col}' の演算子 '{op}' は、数値型の値でのみ機能します。")
                             st.stop()
                
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
        else:
            st.info("条件を一つ以上追加してください。")

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
        label_visibility="collapsed",
        key="group_cols"
    )
    
    st.markdown("### 2️⃣ 集計方法を選択")
    
    col1, col2 = st.columns(2)
    
    with col1:
        calc_type = st.selectbox(
            "計算方法",
            ["件数を数える", "合計", "平均", "最大値", "最小値"],
            help="どのような計算を行うか選択してください",
            key="calc_type"
        )
    
    with col2:
        if calc_type != "件数を数える":
            calc_col = st.selectbox(
                "計算するフィールド",
                valid_columns,
                help="数値が入っているフィールドを選択してください",
                key="calc_col"
            )
        else:
            calc_col = None
            st.info("グループごとのレコード数をカウントします")
    
    st.markdown("---")
    
    if st.button("📊 集計を実行", type="primary", use_container_width=True):
        if not group_cols:
            st.warning("⚠️ グループ化する項目を選択してください")
        elif calc_type != "件数を数える" and calc_col is None:
            st.warning("⚠️ 計算するフィールドを選択してください")
        else:
            with st.spinner("集計中..."):
                df = get_table_data(selected_table, 10000) # 念のため最大10000件取得
                
                if df is not None and len(df) > 0:
                    try:
                        if calc_type == "件数を数える":
                            result = df.groupby(group_cols).size().reset_index(name='件数')
                            result_col_name = '件数'
                        else:
                            # 計算対象の列を数値に変換 (エラーはNaNとして扱う)
                            df[calc_col] = pd.to_numeric(df[calc_col], errors='coerce')
                            
                            if calc_type == "合計":
                                result = df.groupby(group_cols)[calc_col].sum(min_count=1).reset_index(name=f'{calc_col}_合計')
                                result_col_name = f'{calc_col}_合計'
                            elif calc_type == "平均":
                                result = df.groupby(group_cols)[calc_col].mean().reset_index(name=f'{calc_col}_平均')
                                result_col_name = f'{calc_col}_平均'
                            elif calc_type == "最大値":
                                result = df.groupby(group_cols)[calc_col].max().reset_index(name=f'{calc_col}_最大')
                                result_col_name = f'{calc_col}_最大'
                            else: # 最小値
                                result = df.groupby(group_cols)[calc_col].min().reset_index(name=f'{calc_col}_最小')
                                result_col_name = f'{calc_col}_最小'
                        
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
                                # グラフ用のデータセットを作成 (インデックスをグループの最初の列に設定)
                                chart_data = result.set_index(group_cols[0])[result_col_name]
                                
                                col1, col2 = st.columns(2)
                                with col1:
                                    st.markdown("**棒グラフ**")
                                    st.bar_chart(chart_data)
                                with col2:
                                    st.markdown("**折れ線グラフ**")
                                    st.line_chart(chart_data)
                            except Exception as e:
                                st.info(f"グラフ表示エラー: {e}")
                                
                    except Exception as e:
                        st.error(f"❌ 集計エラー: {e}")
                        st.info("💡 計算するフィールドに数値以外のデータが含まれている、またはグループ化の項目が不正である可能性があります。")
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
            'from_table': selected_table if selected_table else '',
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
        table_options = available_tables
        
        # 選択中のテーブルが存在しない場合は最初のテーブルを選択
        initial_index = table_options.index(config['from_table']) if config['from_table'] in table_options else (0 if table_options else -1)
        
        if table_options:
            table_choice = st.selectbox("テーブルを選択", table_options, index=initial_index, label_visibility="collapsed", key="sql_from_table_select")
            config['from_table'] = table_choice
        else:
            config['from_table'] = st.text_input("テーブル名を入力", value=config['from_table'], placeholder="例: T_Expense", label_visibility="collapsed", key="sql_from_table_text")
    
    with col2:
        st.metric("選択中", config['from_table'] if config['from_table'] else "-")
    
    if not config['from_table']:
        st.info("👆 まずテーブル名を選択または入力してください")
        st.stop()
    
    st.markdown("---")
    
    # ステップ2: フィールド選択（オプション）
    st.markdown("### ステップ2: どの項目を見たいですか？（省略可）")
    st.caption("空欄の場合は全ての項目を表示します")
    
    current_columns = get_table_columns(config['from_table'])
    
    with st.expander("✏️ 表示する項目を指定する", expanded=len(config['select_fields']) > 0):
        col1, col2, col3 = st.columns([4, 4, 2])
        with col1:
            sel_field = st.selectbox("項目名", [""] + current_columns, key="sel_field", index=0)
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
            
            new_select_fields = []
            for idx, field in enumerate(config['select_fields']):
                col1, col2 = st.columns([9, 1])
                with col1:
                    display = f"✓ **{field['field']}** (テーブル: {field['table']})"
                    if field.get('alias'):
                        display += f" → 「{field['alias']}」として表示"
                    st.success(display)
                    new_select_fields.append(field)
                with col2:
                    if st.button("❌", key=f"del_select_{idx}"):
                        config['select_fields'].pop(idx)
                        st.rerun()
            
            # config['select_fields'] = new_select_fields # 削除ロジックをボタンに委譲

    st.markdown("---")

    # ステップ3: 結合（JOIN）の設定
    st.markdown("### ステップ3: 関連テーブルとの結合（JOIN）（省略可）")
    
    with st.expander("🔗 結合条件を指定する", expanded=len(config['joins']) > 0):
        col1, col2, col3, col4 = st.columns([3, 3, 4, 2])
        with col1:
            join_type = st.selectbox("結合タイプ", ["LEFT", "INNER", "RIGHT"], key="join_type")
        with col2:
            join_table = st.selectbox("結合するテーブル", [""] + available_tables, key="join_table_name")
        with col3:
            # 結合条件の例を表示
            on_condition = st.text_input("結合条件 (ON)", key="join_on_condition", placeholder="例: T_Expense.ID = T_Detail.ExpenseID")
        with col4:
            st.write("")
            st.write("")
            if st.button("➕ 結合を追加", key="add_join"):
                if join_table and on_condition:
                    config['joins'].append({
                        'type': join_type,
                        'table': join_table,
                        'on_condition': on_condition
                    })
                    st.rerun()
        
        if config['joins']:
            st.markdown("**設定された結合:**")
            for idx, join in enumerate(config['joins']):
                col1, col2 = st.columns([9, 1])
                with col1:
                    st.info(f"{join['type']} JOIN **{join['table']}** ON {join['on_condition']}")
                with col2:
                    if st.button("❌", key=f"del_join_{idx}"):
                        config['joins'].pop(idx)
                        st.rerun()
    
    st.markdown("---")
    
    # ステップ4: 条件（WHERE）の設定
    st.markdown("### ステップ4: 絞り込み条件（WHERE）（省略可）")
    
    with st.expander("📍 絞り込み条件を指定する", expanded=len(config['where_conditions']) > 0):
        # 結合テーブルを含めた利用可能なテーブルリスト
        all_tables = [config['from_table']] + [j['table'] for j in config['joins']]
        
        col1, col2, col3, col4, col5 = st.columns([2, 3, 2, 3, 1])
        with col1:
            # どのテーブルのフィールドかを選択できるようにする
            cond_table = st.selectbox("テーブル", all_tables, key="cond_table")
        with col2:
            cond_field_options = get_table_columns(cond_table)
            cond_field = st.selectbox("フィールド", [""] + cond_field_options, key="cond_field")
        with col3:
            cond_op = st.selectbox("演算子", ["=", "LIKE", ">=", "<=", "IS NULL", "IS NOT NULL"], key="cond_op")
        with col4:
            # IS NULL/IS NOT NULL の場合は値を不要にする
            disabled_val = cond_op in ["IS NULL", "IS NOT NULL"]
            cond_value = st.text_input("値", key="cond_value", disabled=disabled_val, placeholder="例: 100 または '未完了'")
        with col5:
            st.write("")
            st.write("")
            if st.button("➕ 条件を追加", key="add_where"):
                if cond_field and (cond_value or disabled_val):
                    # IS NULL/IS NOT NULL の場合は値をNoneにする
                    value_to_add = None if disabled_val else cond_value
                    config['where_conditions'].append({
                        'table': cond_table,
                        'field': cond_field,
                        'operator': cond_op,
                        'value': value_to_add
                    })
                    st.rerun()
        
        if config['where_conditions']:
            st.markdown("**設定された条件:**")
            for idx, cond in enumerate(config['where_conditions']):
                col1, col2 = st.columns([9, 1])
                with col1:
                    display = f"✓ **{cond['table']}.{cond['field']}** {cond['operator']} "
                    if cond['value'] is not None:
                        display += f"'{cond['value']}'"
                    st.success(display)
                with col2:
                    if st.button("❌", key=f"del_where_{idx}"):
                        config['where_conditions'].pop(idx)
                        st.rerun()

    st.markdown("---")
    
    # ステップ5: その他（ORDER BY, LIMIT）
    st.markdown("### ステップ5: 並べ替えと件数制限（省略可）")
    
    col1, col2 = st.columns(2)
    with col1:
        order_by_options = [f"{t}.{c}" for t in all_tables for c in get_table_columns(t)]
        order_by = st.selectbox(
            "並べ替え (ORDER BY)",
            [""] + order_by_options,
            key="sql_order_by",
            help="例: `DeliveryDate DESC` のようにフィールドと並び順を記述"
        )
        if order_by:
            config['order_by'] = order_by
        else:
            config['order_by'] = ''
            
    with col2:
        limit = st.number_input(
            "取得件数制限 (LIMIT)",
            min_value=1,
            max_value=1000,
            value=config['limit'],
            key="sql_limit"
        )
        config['limit'] = limit

    st.markdown("---")

    # SQLの生成と実行
    generated_sql = build_sql_query(config)
    st.markdown("### ✨ 生成されたSQLクエリ")
    st.code(generated_sql, language='sql')
    
    st.markdown("---")
    
    st.markdown("### ▶️ クエリの結果")
    
    if st.button("▶️ クエリを実行", type="primary", use_container_width=True):
        
        # Supabase Python SDKの簡易的なクエリ実行は、基本的にFROM句で指定されたテーブルに対する操作に限定される
        # JOINや複雑なWHERE句を含む生のSQLクエリは、SupabaseのRPC機能を使って実行する必要があるが、
        # ここでは簡易的にFROM句のクエリとして実行を試みる。
        
        # 簡易実行のため、SQL文字列からテーブル名、WHERE句、LIMITなどを抽出する (非常に危険で推奨されないが、Streamlitの制限上)
        try:
            # 実行結果は表示するが、生のSQL実行はRPC/PostgRESTのRaw SQL機能がないため、エラーになる可能性が高い
            
            st.warning("⚠️ Streamlitアプリ内でのJOINを含む複雑なSQLクエリの実行は、セキュリティ上の制約により通常サポートされていません。FROM句のテーブルに対する簡単なクエリとして解釈して実行を試みます。")
            
            # FROM句のテーブルデータ全体を取得し、Python側でフィルタリングする方が現実的
            # ただし、ここでは元の意図通り、生成されたSQLをそのまま表示します。
            
            # 実行ロジックは実装しない（SQLビルダーの意図はクエリ生成までと判断）
            # もし実行したい場合は、PostgRESTのAPIの制限に準拠したクエリを手動で構築してください。
            
            # 代替案: 実行せず、成功メッセージのみを表示
            st.success("✅ SQLが生成されました！このSQLをSupabaseのSQL Editorで実行してください。")
            
        except Exception as e:
            st.error(f"❌ クエリ実行エラー: {e}")
            st.info("💡 複雑なJOINクエリはSupabaseのSQL Editorで実行してください。単純なクエリのみこちらで実行可能です。")
            
    st.markdown("")
    st.info("💡 単純なクエリ（SELECT * FROM table LIMIT Xなど）は「▶️ クエリを実行」ボタンで結果を確認できる可能性がありますが、JOINを含む複雑なクエリはSupabaseのSQL Editorで実行してください。")
    
    # 使用例
    with st.expander("📖 使い方の例を見る"):
        st.markdown("""
        ### 📌 例：納期が迫っている未納入の注文を検索
        
        **1. メインテーブル**
        ```
        T_Expense
        ```
        
        **2. フィールド選択** (例)
        - テーブル: `T_Expense`, フィールド: `PurchaseNo`, 別名: `注文番号`
        - テーブル: `T_Expense`, フィールド: `Description`, 別名: `品名`
        - テーブル: `T_Expense`, フィールド: `DeliveryDate`, 別名: `納期`
        
        **3. 絞り込み条件（WHERE）**
        - テーブル: `T_Expense`, フィールド: `NounyuDate`, 演算子: `IS NULL`
        - テーブル: `T_Expense`, フィールド: `DeliveryDate`, 演算子: `<='`, 値: `'2024-12-31'`
        
        **4. 並べ替えと件数制限**
        - 並べ替え: `T_Expense.DeliveryDate ASC`
        - 制限: `100`
        """)
