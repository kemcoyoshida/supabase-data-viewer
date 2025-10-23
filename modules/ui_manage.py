import streamlit as st
from .supabase_utils import get_table_columns, get_table_data
from datetime import datetime
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


# --- ヘルパー関数: 新規追加フォーム ---
def show_add_form_toggle(supabase, table):
    st.markdown(
        '<div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); '
        'padding: 20px; border-radius: 10px; margin-bottom: 20px;">'
        '<h3 style="color: white; margin: 0;">➕ 新しいデータを追加</h3>'
        '<p style="color: #e0f7ff; margin: 5px 0 0 0;">ボタンをクリックして入力フォームを開く</p>'
        '</div>',
        unsafe_allow_html=True
    )
    
    if st.button("➕ 入力フォームを開く/閉じる", key="toggle_add_form", use_container_width=True, type="primary"):
        st.session_state["show_add_form"] = not st.session_state.get("show_add_form", False)
    
    if st.session_state.get("show_add_form", False):
        st.markdown("<br>", unsafe_allow_html=True)
        
        cols = get_table_columns(table)
        
        if not cols:
            st.warning("カラム情報が取得できません。", icon="⚠️")
            return
        
        st.markdown(
            '<div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); '
            'padding: 15px; border-radius: 10px; margin-bottom: 15px;">'
            '<h4 style="color: #d84315; margin: 0;">📝 新規データ入力フォーム</h4>'
            '</div>',
            unsafe_allow_html=True
        )
            
        with st.form("add_form", clear_on_submit=True):
            col_list = [c for c in cols if c.lower() not in ["id","created_at","updated_at"]]
            num_cols = 3
            new = {}
            
            # 各項目をカード形式で表示
            for i, c in enumerate(col_list):
                st.markdown(
                    f'<div style="background: #f5f5f5; padding: 10px; border-radius: 5px; '
                    f'margin-bottom: 10px; border-left: 4px solid #4facfe;">'
                    f'<strong>{i+1}. {c}</strong>'
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
            
            col_submit, col_cancel = st.columns([3, 1])
            
            with col_submit:
                submitted = st.form_submit_button("✅ データを追加する", use_container_width=True, type="primary")
            
            with col_cancel:
                if st.form_submit_button("❌ キャンセル", use_container_width=True):
                    st.session_state["show_add_form"] = False
                    st.rerun()
            
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
                        st.session_state["show_add_form"] = False
                        st.rerun()
                    else:
                        st.error(f"❌ 追加失敗: {result}")
        
        st.markdown("---")


# --- コア機能: データ選択とフィルタリング ---
def show_data_selection_core(supabase, table, key_suffix):
    """データ一覧を表示し、フィルタリングと行選択を可能にする"""
    
    # 全データを取得
    df_raw = get_table_data(table, limit=500)
    
    if df_raw is None or df_raw.empty:
        st.info("データがありません", icon="📭")
        return None
        
    df = df_raw.copy()
    id_col = "id" if "id" in df.columns else df.columns[0]
    
    # --- データフレーム表示（最初に表示） ---
    st.markdown(
        f'<div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); '
        f'padding: 10px; border-radius: 8px; margin-bottom: 10px; text-align: center;">'
        f'<p style="margin: 0; color: #333;"><strong>📊 全件数: {len(df_raw)}件</strong> | '
        f'修正・削除したい行をクリックして選択 👇</p>'
        f'</div>',
        unsafe_allow_html=True
    )
    
    # データフレームを選択可能な状態で表示
    selection = st.dataframe(
        df,
        key=f"dataframe_{table}_{key_suffix}",
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
                    st.session_state[f"selected_row_{key_suffix}"] = selected_row_data
                    st.markdown(
                        f'<div style="background: linear-gradient(135deg, #96fbc4 0%, #f9f586 100%); '
                        f'padding: 15px; border-radius: 10px; margin-top: 10px; border-left: 5px solid #00c853;">'
                        f'<p style="margin: 0; color: #2e7d32; font-weight: bold;">✅ ID <code>{selected_row_data.get(id_col)}</code> が選択されました</p>'
                        f'</div>',
                        unsafe_allow_html=True
                    )
    except Exception as e:
        selected_row_data = st.session_state.get(f"selected_row_{key_suffix}", None)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # --- フィルタリング UI（表の下に配置） ---
    with st.expander("🔍 検索・フィルター（データを絞り込む）", expanded=False):
        
        # 日付検索
        date_cols = [c for c in df_raw.columns if 'date' in c.lower() or 'at' in c.lower() or 'time' in c.lower()]

        if date_cols:
            st.markdown(
                '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); '
                'padding: 15px; border-radius: 10px; margin-bottom: 15px;">'
                '<h4 style="color: white; margin: 0;">📅 期間で検索</h4>'
                '</div>',
                unsafe_allow_html=True
            )
            
            col_d1, col_d2, col_d3 = st.columns(3)
            with col_d1:
                date_filter_col = st.selectbox("📆 日付項目", date_cols, key=f"date_filter_col_{key_suffix}")
            
            with col_d2:
                start_date = st.date_input("📍 開始日", value=None, key=f"start_date_{key_suffix}")
            with col_d3:
                end_date = st.date_input("📍 終了日", value=None, key=f"end_date_{key_suffix}")
                
            if start_date or end_date:
                if st.button("🔍 期間フィルタを適用", key=f"apply_date_filter_{key_suffix}", use_container_width=True, type="primary"):
                    st.session_state[f"date_filter_applied_{key_suffix}"] = {
                        "col": date_filter_col,
                        "start": start_date,
                        "end": end_date
                    }
                    st.rerun()
            
            st.markdown("<br>", unsafe_allow_html=True)

        # テキスト/値フィルタリング
        st.markdown(
            '<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); '
            'padding: 15px; border-radius: 10px; margin-bottom: 15px;">'
            '<h4 style="color: white; margin: 0;">🔎 キーワードで検索</h4>'
            '</div>',
            unsafe_allow_html=True
        )
        
        cols = df_raw.columns.tolist()
        
        col1, col2, col3 = st.columns([3, 2, 3])
        with col1:
            filter_col = st.selectbox("📋 検索する項目", cols, key=f"filter_col_{key_suffix}")
        with col2:
            filter_op = st.selectbox("🎯 条件", ["含む", "等しい", "以上", "以下"], key=f"filter_op_{key_suffix}")
        with col3:
            filter_val = st.text_input("🔍 検索値", key=f"filter_val_{key_suffix}", placeholder="検索したい値を入力")
            
        if filter_val:
            if st.button("🔍 キーワードフィルタを適用", key=f"apply_keyword_filter_{key_suffix}", use_container_width=True, type="primary"):
                st.session_state[f"keyword_filter_applied_{key_suffix}"] = {
                    "col": filter_col,
                    "op": filter_op,
                    "val": filter_val
                }
                st.rerun()
        
        # フィルタクリア
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("🔄 すべてのフィルタをクリア", use_container_width=True, type="secondary", key=f"clear_filter_{key_suffix}"):
            st.session_state.pop(f"date_filter_applied_{key_suffix}", None)
            st.session_state.pop(f"keyword_filter_applied_{key_suffix}", None)
            st.rerun()
    
    # フィルタが適用されている場合の表示
    filter_applied = False
    
    # 日付フィルタの適用
    if f"date_filter_applied_{key_suffix}" in st.session_state:
        filter_info = st.session_state[f"date_filter_applied_{key_suffix}"]
        try:
            df["__temp_date"] = pd.to_datetime(df[filter_info["col"]], errors='coerce').dt.date
            
            if filter_info["start"]:
                df = df[df["__temp_date"] >= filter_info["start"]]
            if filter_info["end"]:
                df = df[df["__temp_date"] <= filter_info["end"]]
            
            df = df.drop(columns=["__temp_date"])
            
            date_range_text = f"{filter_info['start'] or '最初'} ～ {filter_info['end'] or '最新'}"
            st.success(f"✅ 期間フィルタ適用中: **{date_range_text}** （表示: {len(df)}件）")
            filter_applied = True
        except Exception as e:
            st.error(f"日付フィルタエラー: {str(e)}")
    
    # キーワードフィルタの適用
    if f"keyword_filter_applied_{key_suffix}" in st.session_state:
        filter_info = st.session_state[f"keyword_filter_applied_{key_suffix}"]
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
            filter_applied = True
        except Exception as e:
            st.error(f"フィルタリングエラー: {str(e)}")
    
    if filter_applied and len(df) < len(df_raw):
        # フィルタ適用後のデータフレームを再表示
        st.markdown("### 🔍 フィルタ結果")
        st.dataframe(
            df,
            key=f"filtered_dataframe_{table}_{key_suffix}",
            use_container_width=True,
            height=300,
            hide_index=True,
            column_order=[id_col] + [c for c in df.columns if c != id_col]
        )
    
    return selected_row_data


# --- ヘルパー関数: 編集フォーム ---
def show_edit_form(supabase, table, selected_row, id_col):
    selected_id = selected_row.get(id_col)
    st.markdown(f"#### ✍️ ID: `{selected_id}` の修正フォーム")
    
    with st.form(f"edit_form_{selected_id}"):
        df_cols = get_table_columns(table)
        upd = {}
        col_list = [c for c in df_cols if c.lower() not in ["id","created_at","updated_at"]]
        num_cols = 3 

        for i in range(0, len(col_list), num_cols):
            cols_form = st.columns(num_cols)
            for j in range(num_cols):
                idx = i + j
                if idx < len(col_list):
                    c = col_list[idx]
                    val = selected_row.get(c, "")
                    upd[c] = cols_form[j].text_input(c, value=str(val) if val is not None else "", key=f"edit_input_{c}_{selected_id}")
        
        if st.form_submit_button(f"💾 実行 - データを保存"):
            update_payload = {k: v for k, v in upd.items()}
            
            success, result = execute_operation(supabase, table, "update", update_payload, condition=(id_col, selected_id))
            
            if success:
                st.success("✅ データが正常に更新されました")
                st.cache_data.clear()
                st.rerun() 
            else:
                st.error(f"❌ 更新失敗: {result}")


# --- メイン描画関数 ---
def show(supabase, available_tables):
    st.markdown("## 📋 データ管理 (統合画面)")
    st.markdown("---")
    
    if not available_tables:
        st.info("テーブルが存在しません。テーブル作成ページで追加してください。", icon="ℹ️")
        return

    # 1. テーブル選択
    col_left, col_right = st.columns([4, 1])
    
    default_table = st.session_state.get("selected_table", available_tables[0])
    default_index = available_tables.index(default_table) if default_table in available_tables else 0

    with col_left:
        table = st.selectbox("📋 テーブルを選択", available_tables, index=default_index, key="manage_table")
    
    if table != st.session_state.get("selected_table_actual"):
        st.session_state["selected_table_actual"] = table
        st.cache_data.clear()
        
    df_count = get_table_data(table, limit=500)
    count = df_count.shape[0] if df_count is not None else 0
    
    with col_right:
        st.metric("総件数", f"{count:,}件")
        
    st.markdown("---")

    # 2. データ一覧・検索・選択（最上部に配置）
    st.markdown("### 📊 データ一覧")
    selected_row = show_data_selection_core(supabase, table, key_suffix="main")

    # 3. 選択した行の操作フォーム（データ一覧の直後）
    if selected_row:
        df_cols = get_table_columns(table)
        id_col = "id" if "id" in df_cols else df_cols[0]
        selected_id = selected_row.get(id_col)
        
        st.markdown("---")
        st.markdown(
            f'<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); '
            f'padding: 20px; border-radius: 10px; margin-bottom: 20px;">'
            f'<h3 style="color: white; margin: 0;">🎯 選択したレコードの操作</h3>'
            f'<p style="color: #e0e0e0; margin: 5px 0 0 0;">ID: <code style="background: rgba(255,255,255,0.2); '
            f'padding: 2px 8px; border-radius: 4px;">{selected_id}</code></p>'
            f'</div>',
            unsafe_allow_html=True
        )
        
        tab1, tab2 = st.tabs(["✍️ 修正", "🗑️ 削除"])
        
        with tab1:
            show_edit_form(supabase, table, selected_row, id_col)
        
        with tab2:
            st.markdown("#### ⚠️ 削除の確認")
            st.warning(f"ID `{selected_id}` のレコードを削除しようとしています。", icon="⚠️")
            
            if st.session_state.get("confirm_delete_id") != selected_id:
                if st.button(f"🗑️ このレコードを削除する", type="secondary", key=f"init_delete_btn_{selected_id}", use_container_width=True):
                    st.session_state["confirm_delete_id"] = selected_id
                    st.rerun()
            else:
                st.error(f"⚠️ **最終確認:** 本当に削除しますか？", icon="🚨")
                
                col_yes, col_no = st.columns(2)
                
                with col_yes:
                    if st.button("✅ はい、削除します", type="primary", key=f"final_delete_yes_{selected_id}", use_container_width=True):
                        success, result = execute_operation(supabase, table, "delete", condition=(id_col, selected_id))
                        if success:
                            st.success("✅ データが正常に削除されました")
                            st.session_state.pop("confirm_delete_id", None)
                            st.session_state.pop("selected_row_main", None)
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
            'padding: 20px; border-radius: 10px; text-align: center; margin-top: 20px;">'
            '<p style="margin: 0; color: #333; font-size: 16px;">👆 データ一覧から行をクリックして選択すると、<br>'
            '<strong>修正・削除</strong>ができます</p>'
            '</div>',
            unsafe_allow_html=True
        )
    
    st.markdown("---")
    
    # 4. 新規追加（最後に配置）
    show_add_form_toggle(supabase, table)
