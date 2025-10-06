@st.cache_data(ttl=300)
def get_all_tables_cached():
    fallback_table = 't_machinecode'
    try:
        # ... pg_tablesからの取得処理 ...
        
        # 取得に成功した場合のロジック
        if response.data:
            # ... テーブルリストを返す ...
            
        # 取得に失敗した場合や例外が発生した場合
    except Exception as e:
        # ❌ ここでエラーメッセージが表示される
        st.error(f"❌ テーブル一覧取得に失敗しました。キーまたは接続設定を確認してください。エラー: {e}")
        # ✅ 't_machinecode' が返されるため、アプリ自体は続行できる
        return [fallback_table] if get_table_structure(fallback_table) else []
