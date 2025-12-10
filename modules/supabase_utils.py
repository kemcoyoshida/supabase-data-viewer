import os
import streamlit as st
from supabase import create_client, Client
from postgrest import APIError
import pandas as pd
import requests

# =============================================================
# 接続情報
# =============================================================
# 🚨 注意: 運用環境では Streamlit secrets / 環境変数への移行を強く推奨します。
DEFAULT_SUPABASE_URL = "https://uevlguozshzwywzqtsvr.supabase.co"
DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldmxndW96c2h6d3l3enF0c3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjkzMDcsImV4cCI6MjA3NDkwNTMwN30.hx82K_19c5Mmh9NXCCf15_yGDPLJ5O_XM_CnWuVMyZ8"

@st.cache_resource
def get_client() -> Client:
    """
    st.secrets、環境変数、またはデフォルト値から接続情報を取得し、Supabaseクライアントを返します。
    """
    url = None
    key = None
    
    # 1) st.secrets (Streamlit Cloud 用)を優先
    try:
        url = st.secrets["SUPABASE_URL"]
        key = st.secrets["SUPABASE_KEY"]
    except Exception:
        pass
    
    # 2) 環境変数またはデフォルト値
    if not url:
        url = os.environ.get("SUPABASE_URL", DEFAULT_SUPABASE_URL)
    if not key:
        key = os.environ.get("SUPABASE_KEY", DEFAULT_SUPABASE_KEY)
        
    # 3) 接続確認
    if not url or not key:
        st.error("Supabase URLまたはKEYが未設定です。", icon="❌")
        st.stop()
    
    try:
        # クライアントをキャッシュし、リソースの再利用を促進
        client = create_client(url, key)
        return client
    except Exception as e:
        st.error(f"Supabase 接続エラー: {e}", icon="🚨")
        st.stop()

# =============================================================
# テーブル作成ロジック (DDL実行制限のためSQL生成・表示に限定)
# =============================================================

def create_table_by_sql(table_name: str, columns: dict, pk_column: str | None) -> tuple[bool, dict]:
    """
    指定されたスキーマで新しいテーブルを作成するSQLを構築し、手動実行を促します。
    
    Supabaseクライアントは不要なため引数から削除し、純粋なロジック関数として動作させます。
    """
    try:
        # 1. カラム定義を生成
        column_defs = []
        for col_name, col_type in columns.items():
            if not col_name or not col_type:
                continue
            
            # 日本語の型をPostgreSQLの型にマッピング
            col_type_str = "TEXT" 
            if col_type == "数値":
                col_type_str = "INT"
            elif col_type == "日時":
                col_type_str = "TIMESTAMPTZ"
            elif col_type == "ブール値":
                col_type_str = "BOOLEAN"
            
            # カラム名と型を定義に追加（二重引用符で囲むことで安全性を確保）
            column_defs.append(f'"{col_name}" {col_type_str}')

        # 2. プライマリキーを追加
        if pk_column and pk_column in columns:
            column_defs.append(f'PRIMARY KEY ("{pk_column}")')
        
        if not column_defs:
            return False, {"error": "カラム定義が空です。最低1つのカラムが必要です。"}
        
        # 3. SQL文を構築
        sql = f"CREATE TABLE public.\"{table_name}\" ({', '.join(column_defs)});"
        
        # 4. 実行を試みる（DDL実行制限のため、SQLを返す）
        feedback_message = (
            f"テーブル作成SQLが正常に生成されました。\n\n"
            f"**⚠️ DDL実行制限:** Streamlitから直接 `CREATE TABLE` を実行することはできません。\n"
            f"以下のSQLをSupabaseの**SQL Editor**にコピー＆ペーストして手動で実行してください。"
        )
        
        return True, {"sql": sql, "feedback": feedback_message}
        
    except Exception as e:
        return False, {"error": f"予期せぬエラー: {str(e)}"}


def create_table_auto(table_name: str, columns: dict, pk_column: str | None = None) -> tuple[bool, dict]:
    """
    create_table_by_sql のエイリアス関数
    既存のコードとの互換性のために残しています
    """
    return create_table_by_sql(table_name, columns, pk_column)

# =============================================================
# テーブル / データ取得等 (元のファイルから継続)
# =============================================================

@st.cache_data(ttl=3600)
def get_available_tables():
    """
    可能な限りテーブル名を自動検出します（RESTルートを試行後フォールバック）。
    """
    url = os.environ.get("SUPABASE_URL", DEFAULT_SUPABASE_URL)
    key = os.environ.get("SUPABASE_KEY", DEFAULT_SUPABASE_KEY)
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    
    # 1. REST APIの定義から取得を試みる (最も信頼性が高い)
    try:
        resp = requests.get(f"{url}/rest/v1/", headers=headers, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            # OpenAPI style response -> extract paths
            if isinstance(data, dict) and "paths" in data:
                tables = []
                for p in data["paths"].keys():
                    if p.startswith("/"):
                        # /tablename?select=* から tablename を抽出
                        name = p.strip("/").split("?")[0]
                        # rpc関数や予約語を除く
                        if name and not name.startswith("rpc") and not name.startswith("$"):
                            tables.append(name)
                return sorted(list(set(tables)))
    except Exception:
        pass

    # 2. フォールバック：よくある名前を試す（REST APIからの取得に失敗した場合）
    common = ["users","user","orders","order","products","product","items","item","customers","customer"]
    client = get_client() # クライアントを再取得
    found = []
    for name in sorted(common):
        try:
            # 実際にデータを取得できるか試す
            r = client.table(name).select("id").limit(1).execute()
            if getattr(r, "data", None) is not None:
                # 成功してもデータが空の場合があるため、エラーを吐かなければOKとする
                found.append(name)
        except Exception:
            # エラーが出たらテーブルが存在しないと判断
            continue
            
    # もしREST APIが使えず、共通名もヒットしなかった場合は空リストを返す
    return sorted(list(set(found)))

def get_table_columns(table_name):
    """
    指定されたテーブルのカラム名を取得します。
    キャッシュを使わず、毎回最新の情報を取得します。
    """
    client = get_client()
    try:
        # まず1件だけデータを取得してカラム名を取得
        r = client.table(table_name).select("*").limit(1).execute()
        
        if getattr(r, "data", None) and len(r.data) > 0:
            # データがある場合はそのキーを返す
            return list(r.data[0].keys())
        
        # データが0件の場合は、REST APIから取得を試みる
        url = os.environ.get("SUPABASE_URL", DEFAULT_SUPABASE_URL)
        key = os.environ.get("SUPABASE_KEY", DEFAULT_SUPABASE_KEY)
        headers = {"apikey": key, "Authorization": f"Bearer {key}"}
        
        try:
            # REST APIのルート定義を取得
            resp = requests.get(f"{url}/rest/v1/", headers=headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                # OpenAPI形式からカラム定義を探す
                if isinstance(data, dict) and "definitions" in data:
                    # table_name に対応する定義を探す
                    for def_name, def_data in data["definitions"].items():
                        if table_name in def_name.lower():
                            if "properties" in def_data:
                                return list(def_data["properties"].keys())
        except Exception:
            pass
        
        # それでも取得できない場合は空リストを返す
        return []
        
    except Exception as e:
        # テーブルが存在しない、またはアクセス権がない場合
        return []

@st.cache_data(ttl=10)  # キャッシュ時間を10秒に短縮して最新データを取得しやすくする
def get_table_data(table_name, limit=10000, select_cols="*"):  # デフォルトの制限を10000件に増加
    client = get_client()
    try:
        q = client.table(table_name).select(select_cols if select_cols else "*")
        resp = q.limit(limit).execute()
        if getattr(resp, "data", None):
            return pd.DataFrame(resp.data)
        return pd.DataFrame()
    except Exception as e:
        st.error(f"データ取得エラー: {e}", icon="⚠️")
        return pd.DataFrame()

@st.cache_data(ttl=3600)
def get_table_count(table_name):
    client = get_client()
    try:
        # count="exact" で全件数を取得
        r = client.table(table_name).select("*", count="exact").limit(0).execute()
        if hasattr(r, "count") and r.count is not None:
            return r.count
        
        return 0
    except Exception:
        return 0