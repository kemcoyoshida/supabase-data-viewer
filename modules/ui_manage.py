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
    
    # 現在のデータ一覧
    df = get_table_data(table, limit=100)
    
    if df is not None and not df.empty:
        id_col = "id" if "id" in df.columns else df.columns[0]
        
        st.dataframe(
            df,
            use_container_width=True,
            height=200,
            hide_index=True,
            column_order=[id_col] + [c for c in df.columns if c != id_col]
        )
    else:
        st.info("データなし", icon="📭")
    
    # 新規追加フォーム
    st.markdown("**新規データ入力**")
    
    cols = get_table_columns(table)
    
    if not cols:
        st.warning("カラム情報が取得できません。", icon="⚠️")
        return
    
    with st.form("add_form", clear_on_submit=True):
        col_list = [c for c in cols if c.lower() not in ["id","created_at","updated_at"]]
        new = {}
        
        # 1行4列のレイアウト
        num_cols = 4
        for i in range(0, len(col_list), num_cols):
            cols_form = st.columns(num_cols)
            for j in range(num_cols):
                idx = i + j
                if idx < len(col_list):
                    c = col_list[idx]
                    with cols_form[j]:
                        new[c] = st.text_input(
                            f"{c}", 
                            key=f"add_input_{table}_{c}",
                            placeholder=f"{c}"
                        )
        
        col_submit, col_clear = st.columns([3, 1])
        
        with col_submit:
            submitted = st.form_submit_button("✅ 追加", use_container_width=True, type="primary")
        
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
    
    df_raw = get_table_data(table, limit=500)
    
    if df_raw is None or df_raw.empty:
        st.info("データなし", icon="📭")
        return
    
    df = df_raw.copy()
    id_col = "id" if "id" in df.columns else df.columns[0]
    
    # 検索フィルター（常に表示、コンパクト）
    st.markdown("**検索**")
    
    # 日付検索
    date_cols = [c for c in df.columns if 'date' in c.lower() or 'at' in c.lower() or 'time' in c.lower()]

    if date_cols:
        col_d1, col_d2, col_d3, col_d4 = st.columns(4)
        with col_d1:
            date_filter_col = st.selectbox("日付", date_cols, key="edit_date_filter_col", label_visibility="collapsed")
        
        with col_d2:
            start_date = st.date_input("開始", value=None, key="edit_start_date", label_visibility="collapsed")
        with col_d3:
            end_date = st.date_input("終了", value=None, key="edit_end_date", label_visibility="collapsed")
        
        with col_d4:
            if st.button("🔍", key="edit_apply_date", use_container_width=True, help="期間検索"):
                if start_date or end_date:
                    st.session_state["edit_date_filter_applied"] = {
                        "col": date_filter_col,
                        "start": start_date,
                        "end": end_date
                    }
                    st.rerun()

    # キーワード検索
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        filter_col = st.selectbox("項目", df_raw.columns.tolist(), key="edit_filter_col", label_visibility="collapsed")
    with col2:
        filter_op = st.selectbox("条件", ["含む", "等しい", "以上", "以下"], key="edit_filter_op", label_visibility="collapsed")
    with col3:
        filter_val = st.text_input("値", key="edit_filter_val", placeholder="検索", label_visibility="collapsed")
    with col4:
        col_search, col_clear = st.columns(2)
        with col_search:
            if st.button("🔍", key="edit_apply_keyword", use_container_width=True, help="検索"):
                if filter_val:
                    st.session_state["edit_keyword_filter_applied"] = {
                        "col": filter_col,
                        "op": filter_op,
                        "val": filter_val
                    }
                    st.rerun()
        with col_clear:
            if st.button("✕", key="edit_clear", use_container_width=True, help="クリア"):
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
    st.caption(f"{len(df)}件")
    
    selection = st.dataframe(
        df,
        key="edit_dataframe",
        use_container_width=True,
        height=250,
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
    except:
        selected_row_data = st.session_state.get("selected_row_edit", None)
    
    # 編集フォーム
    if selected_row_data:
        selected_id = selected_row_data.get(id_col)
        
        st.markdown(f"**編集: ID {selected_id}**")
        
        with st.form(f"edit_form_{selected_id}"):
            df_cols = get_table_columns(table)
            upd = {}
            col_list = [c for c in df_cols if c.lower() not in ["id","created_at","updated_at"]]
            
            # 1行4列のレイアウト
            num_cols = 4
            for i in range(0, len(col_list), num_cols):
                cols_form = st.columns(num_cols)
                for j in range(num_cols):
                    idx = i + j
                    if idx < len(col_list):
                        c = col_list[idx]
                        val = selected_row_data.get(c, "")
                        with cols_form[j]:
                            upd[c] = st.text_input(
                                c, 
                                value=str(val) if val is not None else "", 
                                key=f"edit_input_{c}_{selected_id}"
                            )
            
            if st.form_submit_button("💾 保存", use_container_width=True, type="primary"):
                update_payload = {k: v for k, v in upd.items()}
                
                success, result = execute_operation(supabase, table, "update", update_payload, condition=(id_col, selected_id))
                
                if success:
                    st.success("✅ 更新しました")
                    st.cache_data.clear()
                    st.session_state.pop("selected_row_edit", None)
                    st.rerun() 
                else:
                    st.error(f"❌ 更新失敗: {result}")
    else:
        st.info("👆 編集する行をクリック")


# ========== データ削除ページ ==========
def show_delete_page(supabase, table):
    """データ削除専用ページ"""
    
    df_raw = get_table_data(table, limit=500)
    
    if df_raw is None or df_raw.empty:
        st.info("データなし", icon="📭")
        return
    
    df = df_raw.copy()
    id_col = "id" if "id" in df.columns else df.columns[0]
    
    # 検索フィルター（常に表示、コンパクト）
    st.markdown("**検索**")
    
    # 日付検索
    date_cols = [c for c in df.columns if 'date' in c.lower() or 'at' in c.lower() or 'time' in c.lower()]

    if date_cols:
        col_d1, col_d2, col_d3, col_d4 = st.columns(4)
        with col_d1:
            date_filter_col = st.selectbox("日付", date_cols, key="delete_date_filter_col", label_visibility="collapsed")
        
        with col_d2:
            start_date = st.date_input("開始", value=None, key="delete_start_date", label_visibility="collapsed")
        with col_d3:
            end_date = st.date_input("終了", value=None, key="delete_end_date", label_visibility="collapsed")
        
        with col_d4:
            if st.button("🔍", key="delete_apply_date", use_container_width=True, help="期間検索"):
                if start_date or end_date:
                    st.session_state["delete_date_filter_applied"] = {
                        "col": date_filter_col,
                        "start": start_date,
                        "end": end_date
                    }
                    st.rerun()

    # キーワード検索
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        filter_col = st.selectbox("項目", df_raw.columns.tolist(), key="delete_filter_col", label_visibility="collapsed")
    with col2:
        filter_op = st.selectbox("条件", ["含む", "等しい", "以上", "以下"], key="delete_filter_op", label_visibility="collapsed")
    with col3:
        filter_val = st.text_input("値", key="delete_filter_val", placeholder="検索", label_visibility="collapsed")
    with col4:
        col_search, col_clear = st.columns(2)
        with col_search:
            if st.button("🔍", key="delete_apply_keyword", use_container_width=True, help="検索"):
                if filter_val:
                    st.session_state["delete_keyword_filter_applied"] = {
                        "col": filter_col,
                        "op": filter_op,
                        "val": filter_val
                    }
                    st.rerun()
        with col_clear:
            if st.button("✕", key="delete_clear", use_container_width=True, help="クリア"):
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
    st.caption(f"{len(df)}件")
    
    selection = st.dataframe(
        df,
        key="delete_dataframe",
        use_container_width=True,
        height=250,
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
    except:
        selected_row_data = st.session_state.get("selected_row_delete", None)
    
    # 削除確認
    if selected_row_data:
        selected_id = selected_row_data.get(id_col)
        
        st.markdown(f"**削除: ID {selected_id}**")
        
        # データ詳細
        with st.expander("詳細", expanded=False):
            for key, value in selected_row_data.items():
                st.text(f"{key}: {value}")
        
        if st.session_state.get("confirm_delete_id") != selected_id:
            st.warning("⚠️ このデータを削除します")
            if st.button(f"🗑️ 削除", type="secondary", key=f"init_del_{selected_id}", use_container_width=True):
                st.session_state["confirm_delete_id"] = selected_id
                st.rerun()
        else:
            st.error(f"本当に削除しますか？", icon="🚨")
            
            col_yes, col_no = st.columns(2)
            
            with col_yes:
                if st.button("削除", type="primary", key=f"yes_{selected_id}", use_container_width=True):
                    success, result = execute_operation(supabase, table, "delete", condition=(id_col, selected_id))
                    if success:
                        st.success("✅ 削除しました")
                        st.session_state.pop("confirm_delete_id", None)
                        st.session_state.pop("selected_row_delete", None)
                        st.cache_data.clear()
                        st.rerun() 
                    else:
                        st.error(f"❌ 失敗: {result}")
                        st.session_state.pop("confirm_delete_id", None)
            
            with col_no:
                if st.button("キャンセル", key=f"no_{selected_id}", use_container_width=True):
                    st.session_state.pop("confirm_delete_id", None)
                    st.rerun()
    else:
        st.info("👆 削除する行をクリック")


# ========== メイン画面 ==========
def show(supabase, available_tables):
    """データ管理のメイン画面 - ボタンで機能を切り替え"""
    
    if not available_tables:
        st.info("テーブルが存在しません。テーブル作成ページで追加してください。", icon="ℹ️")
        return
    
    # セッションステートの初期化
    if "manage_mode" not in st.session_state:
        st.session_state["manage_mode"] = "add"
    
    # テーブル選択（検索可能＆コンパクト）
    st.markdown("### データ管理")
    
    col_select, col_count, col_mode1, col_mode2, col_mode3 = st.columns([2, 1, 1, 1, 1])
    
    default_table = st.session_state.get("selected_table", available_tables[0])
    default_index = available_tables.index(default_table) if default_table in available_tables else 0

    with col_select:
        # テーブル選択を検索可能に
        table = st.selectbox(
            "テーブル", 
            available_tables, 
            index=default_index, 
            key="manage_table_select",
            label_visibility="collapsed"
        )
    
    if table != st.session_state.get("selected_table_actual"):
        st.session_state["selected_table_actual"] = table
        st.cache_data.clear()
        
    df_count = get_table_data(table, limit=500)
    count = df_count.shape[0] if df_count is not None else 0
    
    with col_count:
        st.metric("件数", f"{count:,}", label_visibility="visible")
    
    # モード切り替えボタン（小さく）
    with col_mode1:
        if st.button("➕", use_container_width=True, type="primary" if st.session_state["manage_mode"] == "add" else "secondary", help="追加"):
            st.session_state["manage_mode"] = "add"
            st.session_state.pop("edit_date_filter_applied", None)
            st.session_state.pop("edit_keyword_filter_applied", None)
            st.session_state.pop("delete_date_filter_applied", None)
            st.session_state.pop("delete_keyword_filter_applied", None)
            st.rerun()
    
    with col_mode2:
        if st.button("✍️", use_container_width=True, type="primary" if st.session_state["manage_mode"] == "edit" else "secondary", help="編集"):
            st.session_state["manage_mode"] = "edit"
            st.session_state.pop("edit_date_filter_applied", None)
            st.session_state.pop("edit_keyword_filter_applied", None)
            st.session_state.pop("delete_date_filter_applied", None)
            st.session_state.pop("delete_keyword_filter_applied", None)
            st.rerun()
    
    with col_mode3:
        if st.button("🗑️", use_container_width=True, type="primary" if st.session_state["manage_mode"] == "delete" else "secondary", help="削除"):
            st.session_state["manage_mode"] = "delete"
            st.session_state.pop("edit_date_filter_applied", None)
            st.session_state.pop("edit_keyword_filter_applied", None)
            st.session_state.pop("delete_date_filter_applied", None)
            st.session_state.pop("delete_keyword_filter_applied", None)
            st.rerun()
    
    # 選択されたモードに応じてページを表示
    if st.session_state["manage_mode"] == "add":
        show_add_page(supabase, table)
    elif st.session_state["manage_mode"] == "edit":
        show_edit_page(supabase, table)
    elif st.session_state["manage_mode"] == "delete":
        show_delete_page(supabase, table)
