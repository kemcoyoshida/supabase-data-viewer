# modules/ui_dashboard.py
import streamlit as st
from datetime import datetime
from .supabase_utils import get_table_count, get_table_data

def show(supabase, available_tables):
    st.markdown("## 🟤 ダッシュボード")
    if available_tables:
        # NOTE: 毎回全テーブルのレコード数を取得するのは非効率なため、
        # 実際にはキャッシュするか、テーブル数が多い場合はこの計算をスキップすることが推奨されます。
        # ここでは元のコードのロジックを踏襲します。
        total = sum(get_table_count(t) for t in available_tables)
        
        c1, c2, c3 = st.columns(3)
        c1.metric("総レコード数", f"{total:,}")
        c2.metric("テーブル数", f"{len(available_tables)}")
        c3.metric("最終更新", datetime.now().strftime("%Y/%m/%d"))
        
        st.markdown("---")
        st.markdown("### 📋 テーブル一覧")
        
        # 🌟 修正ポイント: 1行あたりのカラム数を4から5に変更
        num_cols = 5 
        rows = (len(available_tables) + num_cols - 1) // num_cols
        
        for r in range(rows):
            # Streamlitのcolumnsはリストで受け取れる
            cols = st.columns(num_cols)
            
            for i in range(num_cols):
                idx = r * num_cols + i
                if idx < len(available_tables):
                    tbl = available_tables[idx]
                    
                    with cols[i]:
                        # 🌟 修正ポイント: use_container_width=True を指定し、幅を均一にする
                        if st.button(f"📄 {tbl}", key=f"dash_tbl_{tbl}", use_container_width=True):
                            st.session_state["selected_table"] = tbl
                            st.session_state["page"] = "データ管理"
                            st.rerun()
    else:
        st.info("テーブルが存在しません。テーブル作成ページで追加してください。")
