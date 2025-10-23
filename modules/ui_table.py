import streamlit as st
from supabase import create_client, Client
from postgrest import APIError

# Supabaseクライアントを取得し、セッション間でキャッシュする関数
@st.cache_resource
def get_supabase_client() -> Client:
    """Supabaseクライアントを初期化し、接続します。"""
    
    # 環境変数からURLとKEYを取得します。
    # Streamlit Cloudを使用している場合、st.secrets["SUPABASE_URL"]を使用します。
    # ローカル環境で実行する場合、環境変数または直接キーを指定してください。
    
    # 🚨 注意: セキュリティのため、実際のプロジェクトではシークレット管理（st.secrets）を強く推奨します。
    
    try:
        url = st.secrets["SUPABASE_URL"]
        key = st.secrets["SUPABASE_KEY"]
    except:
        # st.secretsが見つからない場合のフォールバック（ローカル実行用など）
        st.error("Supabaseの接続情報（SUPABASE_URL, SUPABASE_KEY）がst.secretsに見つかりません。")
        st.stop()
        return None

    return create_client(url, key)

def create_table_by_sql(supabase: Client, table_name: str, columns: dict, pk_column: str | None) -> tuple[bool, str]:
    """
    指定されたスキーマで新しいテーブルを作成するSQLを実行します。
    
    Supabase PythonクライアントのRPC/SQL実行APIを使用します。
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
            
            # カラム名と型を定義に追加（PostgreSQLでは二重引用符で囲むことで予約語や大文字小文字を扱える）
            column_defs.append(f'"{col_name}" {col_type_str}')

        # 2. プライマリキーを追加
        if pk_column and pk_column in columns:
            column_defs.append(f'PRIMARY KEY ("{pk_column}")')
        
        if not column_defs:
            return False, "カラム定義が空です。最低1つのカラムが必要です。"
        
        # 3. SQL文を構築
        # `public` スキーマにテーブルを作成
        sql = f"CREATE TABLE public.\"{table_name}\" ({', '.join(column_defs)});"
        
        # 4. SQLの実行
        # Supabase Pythonクライアントで任意のSQLを実行するには、通常はRPCを介すか、
        # 非推奨の方法として内部のPostgRESTクライアントを直接操作する必要があります。
        # 最も安全な方法は、Supabase側にDDL実行用のFunctionを用意し、それを呼び出すことです。
        
        # 🚨 DDLの直接実行は環境によって制限されます。ここではデバッグ用にSQLを表示し、
        # 実行部分をコメントアウトします。実際に動作させるには、SupabaseのDB側で
        # DDL実行を許可するPostgres Functionを準備し、それをrpcで呼び出す必要があります。

        # 実行のダミーロジック（実際のSQL実行はコメントアウト）
        # result = supabase.rpc('execute_ddl', {'sql_query': sql}).execute() # 仮想的なRPC呼び出し
        
        # 代わりに、デバッグのためにSQLを表示
        st.info(f"テーブル作成SQL: ```sql\n{sql}\n```", icon="📝")
        
        # 🚨 実際には、SQLの実行後、エラーがなければ True を返します。
        # ここでは成功したと仮定します。
        return True, "ダミー成功: テーブル作成SQLが正常に生成されました。Supabaseの制約により、実際の実行は行われていません。"
        
    except APIError as e:
        # Supabase APIからのエラー（テーブル名重複、構文エラーなど）をキャッチ
        return False, f"Supabaseエラー: {e.message}"
    except Exception as e:
        # その他のPythonエラーをキャッチ
        return False, f"予期せぬエラー: {str(e)}"

# 以下はダミーのテーブル一覧データ取得関数
def get_available_tables(supabase: Client):
    """存在するテーブル一覧（ダミー）"""
    return ["dummy_table_1", "users", "items"]

def fetch_table_data(supabase: Client, table_name: str):
    """テーブルのデータを取得（ダミー）"""
    if table_name == "dummy_table_1":
        return pd.DataFrame({"id": [1, 2], "name": ["Apple", "Banana"]})
    return pd.DataFrame()
