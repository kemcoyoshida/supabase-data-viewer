# modules/ui_dashboard.py - クラウド表示対応
import streamlit as st
from datetime import datetime
from .supabase_utils import get_table_count, get_table_data

def show(supabase, available_tables):
    if available_tables:
        # クラウドから最新のレコード数を取得
        # NOTE: 毎回全テーブルのレコード数を取得するのは非効率なため、
        # 実際にはキャッシュするか、テーブル数が多い場合はこの計算をスキップすることが推奨されます。
        # ここでは元のコードのロジックを踏襲します。
        total = sum(get_table_count(t) for t in available_tables)
        
        # メトリックカードをモダンなデザインに
        c1, c2, c3 = st.columns(3)
        
        with c1:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">総レコード数</div>
                <div class="metric-value">{total:,}</div>
            </div>
            """, unsafe_allow_html=True)
        
        with c2:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">テーブル数</div>
                <div class="metric-value">{len(available_tables)}</div>
            </div>
            """, unsafe_allow_html=True)
        
        with c3:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">最終更新</div>
                <div class="metric-value" style="font-size: 24px;">{datetime.now().strftime("%Y/%m/%d")}</div>
            </div>
            """, unsafe_allow_html=True)
        
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("""
        <div style="margin: 30px 0 20px 0;">
            <h2 style="margin: 0;">📋 テーブル一覧</h2>
            <p style="color: #6c757d; font-size: 14px; margin-top: 5px;">クリックしてテーブルを選択</p>
        </div>
        """, unsafe_allow_html=True)
        
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
                        # モダンなテーブルカードボタン
                        st.markdown(f"""
                        <div class="card" style="text-align: center; padding: 20px; cursor: pointer; transition: all 0.3s ease;">
                            <div style="font-size: 32px; margin-bottom: 10px;">📄</div>
                            <div style="font-weight: 700; font-size: 16px; color: #1a1a2e;">{tbl}</div>
                        </div>
                        """, unsafe_allow_html=True)
                        if st.button(f"📄 {tbl}", key=f"dash_tbl_{tbl}", use_container_width=True):
                            st.session_state["selected_table"] = tbl
                            st.session_state["page"] = "データ管理"
                            st.rerun()
    else:
        st.info("テーブルが存在しません。テーブル作成ページで追加してください。")