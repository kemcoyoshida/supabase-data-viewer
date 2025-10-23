# modules/ui_create.py
import streamlit as st
from .supabase_utils import create_table_auto

def show(supabase, available_tables):
    """新しいテーブルを作成"""
    st.markdown("## 🆕 テーブル作成")
    st.markdown("---")
    
    # テーブル名を入力
    st.markdown("### 1️⃣ テーブル名")
    table_name = st.text_input(
        "テーブル名",
        placeholder="半角英数字とアンダースコア（_）のみ",
        help="半角英数字とアンダースコア（_）のみ使用可能"
    )
    
    # 項目数の設定
    st.markdown("### 2️⃣ 項目設定")
    
    if "num_columns" not in st.session_state:
        st.session_state["num_columns"] = 3
    
    col_count, _ = st.columns([1, 3])
    with col_count:
        num_cols = st.number_input(
            "項目数",
            min_value=1,
            max_value=20,
            value=st.session_state["num_columns"],
            key="column_count_input"
        )
        if num_cols != st.session_state["num_columns"]:
            st.session_state["num_columns"] = num_cols
            st.rerun()
    
    # 項目の入力フォーム
    columns = {}
    col_names = []
    
    st.markdown('<div class="card">', unsafe_allow_html=True)
    
    for i in range(st.session_state["num_columns"]):
        col1, col2 = st.columns([3, 2])
        
        with col1:
            col_name = st.text_input(
                f"項目名 {i+1}",
                key=f"col_name_{i}"
            )
            col_names.append(col_name)
        
        with col2:
            col_type = st.selectbox(
                f"データ型 {i+1}",
                ["文字", "数値", "日時", "はい/いいえ"],
                key=f"col_type_{i}"
            )
        
        if col_name:
            columns[col_name] = col_type
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # 主キーを選ぶ
    st.markdown("### 3️⃣ 主キー（任意）")
    
    valid_col_names = [name for name in col_names if name]
    
    if valid_col_names:
        id_option = st.selectbox(
            "主キーに設定する項目",
            ["なし"] + valid_col_names,
            key="id_select",
            help="各レコードを一意に識別する項目"
        )
        id_column = id_option if id_option != "なし" else None
    else:
        id_column = None
        st.info("項目名を入力すると、主キーを設定できます。")
    
    # 作成ボタン
    st.markdown("---")
    
    col_create, col_reset = st.columns([3, 1])
    
    with col_create:
        if st.button("🔨 テーブル作成", use_container_width=True, type="primary"):
            # 入力チェック
            if not table_name:
                st.error("テーブル名を入力してください。", icon="❌")
            elif table_name in available_tables:
                st.error(f"テーブル「{table_name}」は既に存在します。", icon="❌")
            elif not columns:
                st.error("最低1つの項目を設定してください。", icon="❌")
            else:
                # 自動作成を試みる
                with st.spinner("テーブルを作成中..."):
                    success, result = create_table_auto(supabase, table_name, columns, id_column)
                
                if success:
                    # 自動作成成功
                    st.success(f"✅ {result['message']}", icon="🎉")
                    st.balloons()
                    
                    # 作成された項目を表示
                    st.markdown("### 📋 作成された項目")
                    for col_name, col_type in columns.items():
                        st.write(f"• {col_name} （{col_type}）")
                    
                    st.info("左側のメニューから「🔄 更新」ボタンを押すと、新しいテーブルが表示されます。", icon="💡")
                    
                else:
                    # 自動作成失敗 → 手動用のSQLを表示
                    if "message" in result:
                        st.warning(result["message"], icon="⚠️")
                    
                    if "sql" in result:
                        st.markdown("### 📝 手動作成用SQL")
                        st.code(result["sql"], language="sql")
                        
                        # コピー用のテキストエリア
                        st.text_area(
                            "コピー用",
                            result["sql"],
                            height=150,
                            help="このSQLをコピーして、SupabaseのSQL Editorで実行してください。"
                        )
                        
                        st.info(
                            "**手順:**\n"
                            "1. 上のSQLをコピー\n"
                            "2. SupabaseのSQL Editorを開く\n"
                            "3. SQLを貼り付けて実行\n"
                            "4. このアプリで「🔄 更新」ボタンを押す",
                            icon="💡"
                        )
                    
                    if "error" in result and result["error"] not in ["automatic", "permission"]:
                        st.error(f"エラー: {result['error']}", icon="🚨")
    
    with col_reset:
        if st.button("🔄 リセット", use_container_width=True):
            st.session_state["num_columns"] = 3
            st.rerun()
    
    # 既存テーブル一覧
    if available_tables:
        st.markdown("---")
        st.markdown("### 📋 既存のテーブル")
        
        cols_per_row = 4
        rows = (len(available_tables) + cols_per_row - 1) // cols_per_row
        
        for r in range(rows):
            cols = st.columns(cols_per_row)
            for i in range(cols_per_row):
                idx = r * cols_per_row + i
                if idx < len(available_tables):
                    with cols[i]:
                        st.markdown(
                            f'<div class="card" style="text-align:center; padding:15px;">'
                            f'<strong>📄 {available_tables[idx]}</strong>'
                            f'</div>',
                            unsafe_allow_html=True
                        )
