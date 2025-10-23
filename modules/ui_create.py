import streamlit as st
from .supabase_utils import create_table_auto

def show(supabase, available_tables):
    """新しいテーブルを作成"""
    st.markdown("## 🆕 テーブル作成")
    st.markdown("---")
    
    # テーブル名を入力
    st.markdown("### 1️⃣ テーブル名")
    table_name = st.text_input(
        "テーブル名を入力",
        placeholder="例: users, products, orders",
        help="半角英数字とアンダースコア（_）のみ使用可能",
        label_visibility="collapsed"
    )
    if table_name:
        st.success(f"テーブル名: **{table_name}**")
    
    st.markdown("")  # スペース
    
    # 項目数の設定
    st.markdown("### 2️⃣ 項目設定")
    
    if "num_columns" not in st.session_state:
        st.session_state["num_columns"] = 3
    
    col_count, col_info = st.columns([1, 3])
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
    
    with col_info:
        st.info(f"📊 現在 **{num_cols}個** の項目を設定します", icon="ℹ️")
    
    st.markdown("")  # スペース
    
    # 項目の入力フォーム（改善版）
    columns = {}
    col_names = []
    
    st.markdown("#### 📝 各項目の詳細")
    
    # データ型のマッピング（アイコン付き）
    type_icons = {
        "文字": "📝",
        "数値": "🔢",
        "日時": "📅",
        "はい/いいえ": "✅"
    }
    
    for i in range(st.session_state["num_columns"]):
        # 各項目を独立したカードで表示
        st.markdown(
            f'<div class="card" style="background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%); '
            f'border-left: 4px solid #667eea; margin-bottom: 15px; padding: 20px;">',
            unsafe_allow_html=True
        )
        
        st.markdown(f"##### 項目 {i+1}")
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            col_name = st.text_input(
                "項目名",
                placeholder=f"例: name, price, created_at",
                key=f"col_name_{i}",
                help="この項目の名前を入力してください"
            )
            col_names.append(col_name)
        
        with col2:
            col_type = st.selectbox(
                "データ型",
                ["文字", "数値", "日時", "はい/いいえ"],
                key=f"col_type_{i}",
                format_func=lambda x: f"{type_icons.get(x, '')} {x}"
            )
        
        if col_name:
            columns[col_name] = col_type
            st.caption(f"✓ **{col_name}** ({type_icons.get(col_type, '')} {col_type})")
        else:
            st.caption("⚠️ 項目名を入力してください")
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    st.markdown("")  # スペース
    
    # 主キーを選ぶ
    st.markdown("### 3️⃣ 主キー設定（任意）")
    
    valid_col_names = [name for name in col_names if name]
    
    if valid_col_names:
        id_option = st.selectbox(
            "主キーに設定する項目を選択",
            ["なし"] + valid_col_names,
            key="id_select",
            help="各レコードを一意に識別する項目（通常はIDや番号）",
            label_visibility="collapsed"
        )
        id_column = id_option if id_option != "なし" else None
        
        if id_column:
            st.success(f"🔑 主キー: **{id_column}**")
        else:
            st.info("主キーは設定されていません（自動でidカラムが作成されます）")
    else:
        id_column = None
        st.warning("⚠️ 項目名を入力すると、主キーを設定できます。")
    
    st.markdown("")  # スペース
    
    # 作成前の確認サマリー
    if table_name and columns:
        st.markdown("### 📋 作成内容の確認")
        
        col_summary1, col_summary2 = st.columns(2)
        
        with col_summary1:
            st.markdown(f"**テーブル名:** `{table_name}`")
            st.markdown(f"**項目数:** {len(columns)}個")
        
        with col_summary2:
            st.markdown(f"**主キー:** {id_column if id_column else '自動生成 (id)'}")
        
        st.markdown("**項目一覧:**")
        for col_name, col_type in columns.items():
            st.markdown(f"- {type_icons.get(col_type, '')} **{col_name}** ({col_type})")
        
        st.markdown("")  # スペース
    
    # 作成ボタン
    st.markdown("---")
    
    col_create, col_reset, col_spacer = st.columns([2, 1, 1])
    
    with col_create:
        create_btn = st.button(
            "🔨 テーブルを作成する", 
            use_container_width=True, 
            type="primary",
            disabled=not (table_name and columns)
        )
        
        if create_btn:
            # 入力チェック
            if not table_name:
                st.error("❌ テーブル名を入力してください。", icon="🚫")
            elif table_name in available_tables:
                st.error(f"❌ テーブル「{table_name}」は既に存在します。", icon="🚫")
            elif not columns:
                st.error("❌ 最低1つの項目を設定してください。", icon="🚫")
            else:
                # 自動作成を試みる
                with st.spinner("🔄 テーブルを作成中..."):
                    success, result = create_table_auto(supabase, table_name, columns, id_column)
                
                if success:
                    # 自動作成成功
                    st.success(f"✅ {result['message']}", icon="🎉")
                    st.balloons()
                    
                    # 作成された項目を表示
                    st.markdown("### 📋 作成された項目")
                    for col_name, col_type in columns.items():
                        st.write(f"{type_icons.get(col_type, '•')} **{col_name}** （{col_type}）")
                    
                    st.info("💡 左側のメニューから「🔄 更新」ボタンを押すと、新しいテーブルが表示されます。", icon="ℹ️")
                    
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
                            help="このSQLをコピーして、SupabaseのSQL Editorで実行してください。",
                            label_visibility="collapsed"
                        )
                        
                        st.info(
                            "**📖 手順:**\n\n"
                            "1. ⬆️ 上のSQLをコピー\n"
                            "2. 🌐 SupabaseのSQL Editorを開く\n"
                            "3. 📋 SQLを貼り付けて実行\n"
                            "4. 🔄 このアプリで「🔄 更新」ボタンを押す",
                            icon="💡"
                        )
                    
                    if "error" in result and result["error"] not in ["automatic", "permission"]:
                        st.error(f"🚨 エラー: {result['error']}", icon="❌")
    
    with col_reset:
        if st.button("🔄 リセット", use_container_width=True):
            st.session_state["num_columns"] = 3
            for key in list(st.session_state.keys()):
                if key.startswith("col_name_") or key.startswith("col_type_"):
                    del st.session_state[key]
            st.rerun()
