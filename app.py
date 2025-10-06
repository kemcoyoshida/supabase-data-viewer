import streamlit as st
from supabase import create_client, Client
import pandas as pd
import os

# =================================================================
# 1. 接続情報とキャッシュ付きデータ取得関数の定義
# =================================================================

# SupabaseのプロジェクトURL
SUPABASE_URL = "https://uevlguozshzwywzqtsvr.supabase.co"

# Streamlit Cloudのシークレット (secrets.toml) からキーを取得
# Streamlit Cloudにデプロイする際、このキーが安全に提供されます。
if "SUPABASE_KEY" in st.secrets:
    SUPABASE_KEY = st.secrets["SUPABASE_KEY"]
else:
    # ローカルテスト用やキー未設定時の警告
    SUPABASE_KEY = None
    st.warning("🚨 Streamlitシークレットに 'SUPABASE_KEY' が設定されていません。デプロイ設定を確認してください。")


@st.cache_data(ttl=600) # データを10分間キャッシュします
def get_data_from_supabase(table_name: str, limit: int) -> pd.DataFrame | None:
    """Supabaseからデータを取得し、DataFrameとして返す（キャッシュ付き）"""
    if not SUPABASE_KEY:
        return None
    
    try:
        # Supabaseクライアントを作成
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # データを取得
        response = supabase.table(table_name).select("*").limit(limit).execute()
        
        if response.data:
            return pd.DataFrame(response.data)
        else:
            return None
            
    except Exception as e:
        # Streamlitにエラーメッセージを表示
        st.error(f"❌ データ取得エラー: {e}")
        st.info("💡 トラブルシューティング: SUPABASE_KEY、テーブル名、Supabaseの公開設定を確認してください。")
        return None


# =================================================================
# 2. Streamlit UI の構築
# =================================================================

st.set_page_config(page_title="Supabase データビューア", layout="wide")

st.title("📊 Supabase データビューア")
st.markdown("サイドバーでテーブル名と取得件数を設定し、データを取得・表示します。")

# --- サイドバー (Sidebar) ---
st.sidebar.header("データ取得設定")
table_name = st.sidebar.text_input("テーブル名を入力", value='t_machinecode')
limit = st.sidebar.slider("取得件数の上限", min_value=1, max_value=5000, value=100)

# --- メインエリア ---

if SUPABASE_KEY is None:
    st.error("接続キーが設定されていません。アプリを実行する前にシークレットを設定してください。")
elif st.button("🔄 データを取得して表示", use_container_width=True):
    
    # データを取得
    with st.spinner(f"テーブル '{table_name}' からデータを取得中..."):
        df = get_data_from_supabase(table_name, limit)

    if df is not None:
        st.success(f"✅ データ取得成功: {len(df)}件")
        
        st.subheader(f"テーブル: `{table_name}`")
        st.caption(f"表示件数: {len(df)}")
        
        # 取得データをインタラクティブな表で表示
        st.dataframe(df, use_container_width=True) 
        
        # データの詳細情報
        st.markdown("---")
        if st.checkbox('データの統計情報を表示 (Describe)'):
            st.subheader("統計情報")
            st.dataframe(df.describe().T) # 統計情報を転置して見やすく表示
        
        if st.checkbox('データ型を表示 (Dtypes)'):
            st.subheader("データ型")
            # SeriesをDataFrameに変換して見やすくする
            dtypes_df = df.dtypes.rename("Data Type").to_frame()
            st.dataframe(dtypes_df, use_container_width=True)
            
    else:
        st.info(f"テーブル '{table_name}' にデータが見つからなかったか、エラーが発生しました。")
