import streamlit as st
from .supabase_utils import get_table_columns, get_table_data
import pandas as pd

# データ操作関数
def execute_operation(supabase, table, operation, data=None, condition=None):
    try:
        if operation == "insert":
            resp = supabase.table(table).insert(data).execute()
        elif operation == "update":
            col, val = condition
            resp = supabase.table(table).update(data).eq(col, val).execute()
        elif operation == "delete":
            col, val = condition
            resp = supabase.table(table).delete().eq(col, val).execute()
        
        return True, resp
    except Exception as e:
        return False, str(e)


# ========== データ追加ページ ==========
def show_add_page(supabase, table):
    """データ追加専用ページ"""
    st.markdown("## ➕ データ追加")
    st.markdown("---")
    
    # 現在のデータ一覧
    st.markdown("### 📊 現在のデータ一覧")
    
    df = get_table_data(table, limit=100)
    
    if df is not None and not df.empty:
        st.markdown(
            f'<div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); '
            f'padding: 10px; border-radius: 8px; margin-bottom: 10px; text-align: center;">'
            f'<p style="margin: 0; color: #333;"><strong>📊 最新 {len(df)}件を表示</strong></p>'
            f'</div>',
            unsafe_allow_html=True
        )
        
        id_col = "id" if "id" in df.columns else df.columns[0]
        
        st.dataframe(
            df,
            use_container_width=True,
            height=300,
            hide_index=True,
            column_order=[id_col] + [c for c in df.columns if c != id_col]
        )
    else:
        st.info("データがありません。最初のデータを追加しましょう！", icon="📭")
    
    st.markdown("---")
    
    # 新規追加フォーム
    st.markdown(
        '<div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); '
        'padding: 20px; border-radius: 10px; margin-bottom: 20px;">'
        '<h3 style="color: white; margin: 0;">➕ 新しいデータを追加</h3>'
        '<p style="color: #e0f7ff; margin: 5px 0 0 0;">下のフォームに入力してデータを追加</p>'
        '</div>',
        unsafe_allow_html=True
    )
    
    cols = get_table_columns(table)
    
    if not cols:
        st.warning("カラム情報が取得できません。", icon="⚠️")
        return
    
    with st.form("add_form", clear_on_submit=True):
        col_list = [c for c in cols if c.lower() not in ["id","created_at","updated_at"]]
        new = {}
        
        for i, c in enumerate(col_list):
            st.markdown(
                f'<div style="background: #f5f5f5; padding: 10px; border-radius: 5px; '
                f'margin-bottom: 10px; border-left: 4px solid #4facfe;">'
                f'<strong>📝 {i+1}. {c}</strong>'
                f'</div>',
                unsafe_allow_html=True
            )
            new[c] = st.text_input(
                f"値を入力", 
                key=f"add_input_{table}_{c}",
                placeholder=f"{c} の値を入力してください",
                label_visibility="collapsed"
            )
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        col_submit, col_clear = st.columns([3, 1])
        
        with col_submit:
            submitted = st.form_submit_button("✅ データを追加する", use_container_width=True, type="primary")
        
        with col_clear:
            st.form_submit_button("🔄 クリア", use_container_width=True)
        
        if submitted:
            payload = {k:v for k,v in new.items() if v not in [None,""]}
            if not payload:
                st.warning("⚠️ 少なくとも1つの項目に値を入力してください。", icon="⚠️")
            else:
                success, result = execute_operation(supabase, table, "insert", payload)
                if success:
                    st.success("🎉 データが正常に追加されました！")
                    st.balloons()
                    st.cache_data.clear()
                    st.rerun()
                else:
                    st.error(f"❌ 追加失敗: {result}")


# ========== データ編集ページ ==========
def show_edit_page(supabase, table):
    """データ編集専用ページ"""
    st.markdown("## ✍️ データ編集")
    st.markdown("---")
    
    # データ一覧と検索
    st.markdown("### 📊 データ一覧・検索")
    
    df_raw = get_table_data(table, limit=500)
    
    if df_raw is None or df_raw.empty:
        st.info("データがありません", icon="📭")
        return
    
    df = df_raw.copy()
    id_col = "id" if "id" in df.columns else df.columns[0]
    
    # 検索フィルター
    with st.expander("🔍 検索・フィルター", expanded=False):
        
        # 日付検索
        date_cols = [c for c in df.columns if 'date' in c.lower() or 'at' in c.lower() or 'time' in c.lower()]

        if date_cols:
            st.markdown("#### 📅 期間で検索")
            
            col_d1, col_d2, col_d3 = st.columns(3)
            with col_d1:
                date_filter_col = st.selectbox("📆 日付項目", date_cols, key="edit_date_filter_col")
            
            with col_d2:
                start_date = st.date_input("📍 開始日", value=None, key="edit_start_date")
            with col_d3:
                end_date = st.date_input("📍 終了日", value=None, key="edit_end_date")
                
            if start_date or end_date:
                if st.button("🔍 期間フィルタを適用", key="edit_apply_date_filter", use_container_width=True, type="primary"):
                    st.session_state["edit_date_filter_applied"] = {
                        "col": date_filter_col,
                        "start": start_date,
                        "end": end_date
                    }
                    st.rerun()
            
            st.markdown("<br>", unsafe_allow_html=True)

        # キーワード検索
        st.markdown("#### 🔎 キーワードで検索")
        
        cols = df_raw.columns.tolist()
        
        col1, col2, col3 = st.columns([3, 2, 3])
        with col1:
            filter_col = st.selectbox("📋 検索する項目", cols, key="edit_filter_col")
        with col2:
            filter_op = st.selectbox("🎯 条件", ["含む", "等しい", "以上", "以下"], key="edit_filter_op")
        with col3:
            filter_val = st.text_input("🔍 検索値", key="edit_filter_val", placeholder="検索したい値を入力")
            
        if filter_val:
            if st.button("🔍 キーワードフィルタを適用", key="edit_apply_keyword_filter", use_container_width=True, type="primary"):
                st.session_state["edit_keyword_filter_applied"] = {
                    "col": filter_col,
                    "op": filter_op,
                    "val": filter_val
                }
                st.rerun()
        
        # フィルタクリア
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("🔄 すべてのフィルタをクリア", use_container_width=True, type="secondary", key="edit_clear_filter"):
            st.session_state.pop("edit_date_filter_applied", None)
            st.session_state.pop("edit_keyword_filter_applied", None)
            st.rerun()
    
    # フィルタ適用
    if "edit_date_filter_applied" in st.session_state:
        filter_info = st.session_state["edit_date_filter_applied"]
        try:
            df["__temp_date"] = pd.to_datetime(df[filter_info["col"]], errors='coerce').dt.date
            
            if filter_info["start"]:
                df = df[df["__temp_date"] >= filter_info["start"]]
            if filter_info["end"]:
                df = df[df["__temp_date"] <= filter_info["end"]]
            
            df = df.drop(columns=["__temp_date"])
            
            date_range_text = f"{filter_info['start'] or '最初'} ～ {filter_info['end'] or '最新'}"
            st.success(f"✅ 期間フィルタ適用中: **{date_range_text}** （表示: {len(df)}件）")
        except Exception as e:
            st.error(f"日付フィルタエラー: {str(e)}")
    
    if "edit_keyword_filter_applied" in st.session_state:
        filter_info = st.session_state["edit_keyword_filter_applied"]
        try:
            if filter_info["op"] == "等しい":
                df = df[df[filter_info["col"]].astype(str) == filter_info["val"]]
            elif filter_info["op"] == "含む":
                df = df[df[filter_info["col"]].astype(str).str.contains(filter_info["val"], case=False, na=False)]
            elif filter_info["op"] == "以上":
                df = df[pd.to_numeric(df[filter_info["col"]], errors='coerce') >= float(filter_info["val"])]
            elif filter_info["op"] == "以下":
                df = df[pd.to_numeric(df[filter_info["col"]], errors='coerce') <= float(filter_info["val"])]
            
            st.success(f"✅ キーワードフィルタ適用中: **{filter_info['col']}** が **{filter_info['val']}** を{filter_info['op']} （表示: {len(df)}件）")
        except Exception as e:
            st.error(f"フィルタリングエラー: {str(e)}")
    
    # データ一覧表示
    st.markdown(
        f'<div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); '
        f'padding: 10px; border-radius: 8px; margin-bottom: 10px; text-align: center;">'
        f'<p style="margin: 0; color: #333;"><strong>📊 表示件数: {len(df)}件</strong> | '
        f'編集したい行をクリックして選択 👇</p>'
        f'</div>',
        unsafe_allow_html=True
    )
    
    selection = st.dataframe(
        df,
        key="edit_dataframe",
        use_container_width=True,
        height=400,
        hide_index=True,
        column_order=[id_col] + [c for c in df.columns if c != id_col],
        on_select="rerun",
        selection_mode="single-row"
    )
    
    # 選択された行の処理
    selected_row_data = None
    
    try:
        if hasattr(selection, 'selection') and hasattr(selection.selection, 'rows'):
            selected_indices = selection.selection.rows
            if selected_indices and len(selected_indices) > 0:
                selected_index = selected_indices[0]
                if selected_index < len(df):
                    selected_row_data = df.iloc[selected_index].to_dict()
                    st.session_state["selected_row_edit"] = selected_row_data
                    st.markdown(
                        f'<div style="background: linear-gradient(135deg, #96fbc4 0%, #f9f586 100%); '
                        f'padding: 15px; border-radius: 10px; margin-top: 10px; border-left: 5px solid #00c853;">'
                        f'<p style="margin: 0; color: #2e7d32; font-weight: bold;">✅ ID <code>{selected_row_data.get(id_col)}</code> が選択されました</p>'
                        f'</div>',
                        unsafe_allow_html=True
                    )
    except:
        selected_row_data = st.session_state.get("selected_row_edit", None)
    
    st.markdown("---")
    
    # 編集フォーム
    if selected_row_data:
        selected_id = selected_row_data.get(id_col)
        
        st.markdown(
            f'<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); '
            f'padding: 20px; border-radius: 10px; margin-bottom: 20px;">'
            f'<h3 style="color: white; margin: 0;">✍️ データ編集フォーム</h3>'
            f'<p style="color: #ffe0e0; margin: 5px 0 0 0;">ID: <code style="background: rgba(255,255,255,0.2); '
            f'padding: 2px 8px; border-radius: 4px;">{selected_id}</code></p>'
            f'</div>',
            unsafe_allow_html=True
        )
        
        with st.form(f"edit_form_{selected_id}"):
            df_cols = get_table_columns(table)
            upd = {}
            col_list = [c for c in df_cols if c.lower() not in ["id","created_at","updated_at"]]
            
            for i, c in enumerate(col_list):
                val = selected_row_data.get(c, "")
                st.markdown(
                    f'<div style="background: #f5f5f5; padding: 10px; border-radius: 5px; '
                    f'margin-bottom: 10px; border-left: 4px solid #f093fb;">'
                    f'<strong>📝 {i+1}. {c}</strong>'
                    f'</div>',
                    unsafe_allow_html=True
                )
                upd[c] = st.text_input(
                    c, 
                    value=str(val) if val is not None else "", 
                    key=f"edit_input_{c}_{selected_id}",
                    label_visibility="collapsed"
                )
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            if st.form_submit_button("💾 変更を保存する", use_container_width=True, type="primary"):
                update_payload = {k: v for k, v in upd.items()}
                
                success, result = execute_operation(supabase, table, "update", update_payload, condition=(id_col, selected_id))
                
                if success:
                    st.success("✅ データが正常に更新されました")
                    st.cache_data.clear()
                    st.session_state.pop("selected_row_edit", None)
                    st.rerun() 
                else:
                    st.error(f"❌ 更新失敗: {result}")
    else:
        st.markdown(
            '<div style="background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%); '
            'padding: 20px; border-radius: 10px; text-align: center;">'
            '<p style="margin: 0; color: #333; font-size: 16px;">👆 データ一覧から編集したい行をクリックしてください</p>'
            '</div>',
            unsafe_allow_html=True
        )


# ========== データ削除ページ ==========
def show_delete_page(supabase, table):
    """データ削除専用ページ"""
    st.markdown("## 🗑️ データ削除")
    st.markdown("---")
    
    # データ一覧と検索
    st.markdown("### 📊 データ一覧・検索")
    
    df_raw = get_table_data(table, limit=500)
    
    if df_raw is None or df_raw.empty:
        st.info("データがありません", icon="📭")
        return
    
    df = df_raw.copy()
    id_col = "id" if "id" in df.columns else df.columns[0]
    
    # 検索フィルター
    with st.expander("🔍 検索・フィルター", expanded=False):
        
        # 日付検索
        date_cols = [c for c in df.columns if 'date' in c.lower() or 'at' in c.lower() or 'time' in c.lower()]

        if date_cols:
            st.markdown("#### 📅 期間で検索")
            
            col_d1, col_d2, col_d3 = st.columns(3)
            with col_d1:
                date_filter_col = st.selectbox("📆 日付項目", date_cols, key="delete_date_filter_col")
            
            with col_d2:
                start_date = st.date_input("📍 開始日", value=None, key="delete_start_date")
            with col_d3:
                end_date = st.date_input("📍 終了日", value=None, key="delete_end_date")
                
            if start_date or end_date:
                if st.button("🔍 期間フィルタを適用", key="delete_apply_date_filter", use_container_width=True, type="primary"):
                    st.session_state["delete_date_filter_applied"] = {
                        "col": date_filter_col,
                        "start": start_date,
                        "end": end_date
                    }
                    st.rerun()
            
            st.markdown("<br>", unsafe_allow_html=True)

        # キーワード検索
        st.markdown("#### 🔎 キーワードで検索")
        
        cols = df_raw.columns.tolist()
        
        col1, col2, col3 = st.columns([3, 2, 3])
        with col1:
            filter_col = st.selectbox("📋 検索する項目", cols, key="delete_filter_col")
        with col2:
            filter_op = st.selectbox("🎯 条件", ["含む", "等しい", "以上", "以下"], key="delete_filter_op")
        with col3:
            filter_val = st.text_input("🔍 検索値", key="delete_filter_val", placeholder="検索したい値を入力")
            
        if filter_val:
            if st.button("🔍 キーワードフィルタを適用", key="delete_apply_keyword_filter", use_container_width=True, type="primary"):
                st.session_state["delete_keyword_filter_applied"] = {
                    "col": filter_col,
                    "op": filter_op,
                    "val": filter_val
                }
                st.rerun()
        
        # フィルタクリア
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("🔄 すべてのフィルタをクリア", use_container_width=True, type="secondary", key="delete_clear_filter"):
            st.session_state.pop("delete_date_filter_applied", None)
            st.session_state.pop("delete_keyword_filter_applied", None)
            st.rerun()
    
    # フィルタ適用
    if "delete_date_filter_applied" in st.session_state:
        filter_info = st.session_state["delete_date_filter_applied"]
        try:
            df["__temp_date"] = pd.to_datetime(df[filter_info["col"]], errors='coerce').dt.date
            
            if filter_info["start"]:
                df = df[df["__temp_date"] >= filter_info["start"]]
            if filter_info["end"]:
                df = df[df["__temp_date"] <= filter_info["end"]]
            
            df = df.drop(columns=["__temp_date"])
            
            date_range_text = f"{filter_info['start'] or '最初'} ～ {filter_info['end'] or '最新'}"
            st.success(f"✅ 期間フィルタ適用中: **{date_range_text}** （表示: {len(df)}件）")
        except Exception as e:
            st.error(f"日付フィルタエラー: {str(e)}")
    
    if "delete_keyword_filter_applied" in st.session_state:
        filter_info = st.session_state["delete_keyword_filter_applied"]
        try:
            if filter_info["op"] == "等しい":
                df = df[df[filter_info["col"]].astype(str) == filter_info["val"]]
            elif filter_info["op"] == "含む":
                df = df[df[filter_info["col"]].astype(str).str.contains(filter_info["val"], case=False, na=False)]
            elif filter_info["op"] == "以上":
                df = df[pd.to_numeric(df[filter_info["col"]], errors='coerce') >= float(filter_info["val"])]
            elif filter_info["op"] == "以下":
                df = df[pd.to_numeric(df[filter_info["col"]], errors='coerce') <= float(filter_info["val"])]
            
            st.success(f"✅ キーワードフィルタ適用中: **{filter_info['col']}** が **{filter_info['val']}** を{filter_info['op']} （表示: {len(df)}件）")
        except Exception as e:
            st.error(f"フィルタリングエラー: {str(e)}")
    
    # データ一覧表示
    st.markdown(
        f'<div style="background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); '
        f'padding: 10px; border-radius: 8px; margin-bottom: 10px; text-align: center;">'
        f'<p style="margin: 0; color: #333;"><strong>📊 表示件数: {len(df)}件</strong> | '
        f'削除したい行をクリックして選択 👇</p>'
        f'</div>',
        unsafe_allow_html=True
    )
    
    selection = st.dataframe(
        df,
        key="delete_dataframe",
        use_container_width=True,
        height=400,
        hide_index=True,
        column_order=[id_col] + [c for c in df.columns if c != id_col],
        on_select="rerun",
        selection_mode="single-row"
    )
    
    # 選択された行の処理
    selected_row_data = None
    
    try:
        if hasattr(selection, 'selection') and hasattr(selection.selection, 'rows'):
            selected_indices = selection.selection.rows
            if selected_indices and len(selected_indices) > 0:
                selected_index = selected_indices[0]
                if selected_index < len(df):
                    selected_row_data = df.iloc[selected_index].to_dict()
                    st.session_state["selected_row_delete"] = selected_row_data
                    st.markdown(
                        f'<div style="background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%); '
                        f'padding: 15px; border-radius: 10px; margin-top: 10px; border-left: 5px solid #e74c3c;">'
                        f'<p style="margin: 0; color: #c0392b; font-weight: bold;">⚠️ ID <code>{selected_row_data.get(id_col)}</code> が選択されました</p>'
                        f'</div>',
                        unsafe_allow_html=True
                    )
    except:
        selected_row_data = st.session_state.get("selected_row_delete", None)
    
    st.markdown("---")
    
    # 削除確認
    if selected_row_data:
        selected_id = selected_row_data.get(id_col)
        
        st.markdown(
            f'<div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); '
            f'padding: 20px; border-radius: 10px; margin-bottom: 20px;">'
            f'<h3 style="color: white; margin: 0;">🗑️ 削除の確認</h3>'
            f'<p style="color: #ffe0e0; margin: 5px 0 0 0;">ID: <code style="background: rgba(255,255,255,0.2); '
            f'padding: 2px 8px; border-radius: 4px;">{selected_id}</code></p>'
            f'</div>',
            unsafe_allow_html=True
        )
        
        # 選択されたデータの詳細表示
        st.markdown("#### 📄 削除するデータの詳細")
        
        for key, value in selected_row_data.items():
            st.markdown(
                f'<div style="background: #fff3cd; padding: 10px; border-radius: 5px; '
                f'margin-bottom: 5px; border-left: 4px solid #ffc107;">'
                f'<strong>{key}:</strong> {value}'
                f'</div>',
                unsafe_allow_html=True
            )
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        if st.session_state.get("confirm_delete_id") != selected_id:
            # 第一段階：削除開始ボタン
            st.warning("⚠️ このデータを削除しようとしています。", icon="⚠️")
            if st.button(f"🗑️ このレコードを削除する", type="secondary", key=f"init_delete_btn_{selected_id}", use_container_width=True):
                st.session_state["confirm_delete_id"] = selected_id
                st.rerun()
        else:
            # 第二段階：最終確認
            st.error(f"⚠️ **最終確認:** 本当に削除しますか？この操作は取り消せません！", icon="🚨")
            
            col_yes, col_no = st.columns(2)
            
            with col_yes:
                if st.button("✅ はい、削除します", type="primary", key=f"final_delete_yes_{selected_id}", use_container_width=True):
                    success, result = execute_operation(supabase, table, "delete", condition=(id_col, selected_id))
                    if success:
                        st.success("✅ データが正常に削除されました")
                        st.session_state.pop("confirm_delete_id", None)
                        st.session_state.pop("selected_row_delete", None)
                        st.cache_data.clear()
                        st.rerun() 
                    else:
                        st.error(f"❌ 削除失敗: {result}")
                        st.session_state.pop("confirm_delete_id", None)
            
            with col_no:
                if st.button("❌ キャンセル", key=f"final_delete_no_{selected_id}", use_container_width=True):
                    st.session_state.pop("confirm_delete_id", None)
                    st.info("削除をキャンセルしました。")
                    st.rerun()
    else:
        st.markdown(
            '<div style="background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%); '
            'padding: 20px; border-radius: 10px; text-align: center;">'
            '<p style="margin: 0; color: #333; font-size: 16px;">👆 データ一覧から削除したい行をクリックしてください</p>'
            '</div>',
            unsafe_allow_html=True
        )


# ========== メイン画面 ==========
def show(supabase, available_tables):
    """データ管理のメイン画面 - ボタンで機能を切り替え"""
    
    if not available_tables:
        st.info("テーブルが存在しません。テーブル作成ページで追加してください。", icon="ℹ️")
        return
    
    # セッションステートの初期化
    if "manage_mode" not in st.session_state:
        st.session_state["manage_mode"] = "add"
    
    # テーブル選択
    col_left, col_right = st.columns([4, 1])
    
    default_table = st.session_state.get("selected_table", available_tables[0])
    default_index = available_tables.index(default_table) if default_table in available_tables else 0

    with col_left:
        table = st.selectbox("📋 テーブルを選択", available_tables, index=default_index, key="manage_table_select")
    
    if table != st.session_state.get("selected_table_actual"):
        st.session_state["selected_table_actual"] = table
        st.cache_data.clear()
        
    df_count = get_table_data(table, limit=500)
    count = df_count.shape[0] if df_count is not None else 0
    
    with col_right:
        st.metric("総件数", f"{count:,}件")
    
    st.markdown("---")
    
    # モード切り替えボタン（大きくて目立つデザイン）
    st.markdown(
        '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); '
        'padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center;">'
        '<h4 style="color: white; margin: 0;">🎯 操作を選択してください</h4>'
        '</div>',
        unsafe_allow_html=True
    )
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("➕ データ追加", use_container_width=True, type="primary" if st.session_state["manage_mode"] == "add" else "secondary"):
            st.session_state["manage_mode"] = "add"
            # フィルタをクリア
            st.session_state.pop("edit_date_filter_applied", None)
            st.session_state.pop("edit_keyword_filter_applied", None)
            st.session_state.pop("delete_date_filter_applied", None)
            st.session_state.pop("delete_keyword_filter_applied", None)
            st.rerun()
    
    with col2:
        if st.button("✍️ データ編集", use_container_width=True, type="primary" if st.session_state["manage_mode"] == "edit" else "secondary"):
            st.session_state["manage_mode"] = "edit"
            # フィルタをクリア
            st.session_state.pop("edit_date_filter_applied", None)
            st.session_state.pop("edit_keyword_filter_applied", None)
            st.session_state.pop("delete_date_filter_applied", None)
            st.session_state.pop("delete_keyword_filter_applied", None)
            st.rerun()
    
    with col3:
        if st.button("🗑️ データ削除", use_container_width=True, type="primary" if st.session_state["manage_mode"] == "delete" else "secondary"):
            st.session_state["manage_mode"] = "delete"
            # フィルタをクリア
            st.session_state.pop("edit_date_filter_applied", None)
            st.session_state.pop("edit_keyword_filter_applied", None)
            st.session_state.pop("delete_date_filter_applied", None)
            st.session_state.pop("delete_keyword_filter_applied", None)
            st.rerun()
    
    st.markdown("---")
    
    # 選択されたモードに応じてページを表示
    if st.session_state["manage_mode"] == "add":
        show_add_page(supabase, table)
    elif st.session_state["manage_mode"] == "edit":
        show_edit_page(supabase, table)
    elif st.session_state["manage_mode"] == "delete":
        show_delete_page(supabase, table)
