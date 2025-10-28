import streamlit as st
from .supabase_utils import get_table_columns, get_table_data
from datetime import datetime
import pandas as pd

# データ操作関数 - 実際はapp.pyのSupabaseクライアント経由で実行
def execute_operation(supabase, table, operation, data=None, condition=None):
    try:
        if operation == "insert":
            resp = supabase.table(table).insert(data).execute()
        elif operation == "update":
            # condition は (column, value) のタプルを想定
            col, val = condition
            resp = supabase.table(table).update(data).eq(col, val).execute()
        elif operation == "delete":
            col, val = condition
            resp = supabase.table(table).delete().eq(col, val).execute()
        
        return True, resp
    except Exception as e:
        # 実際にはより詳細なエラーハンドリングが必要
        return False, str(e)


# --- ヘルパー関数: 新規追加フォームの表示 (トグル機能付き) ---
def show_add_form_toggle(supabase, table):
    st.markdown("### ➕ データ追加")
    # 表の下に配置し、デフォルトは閉じる
    if st.button("➕ 新規レコードを追加", key="toggle_add_form", use_container_width=True):
        st.session_state["show_add_form"] = not st.session_state.get("show_add_form", False)

    if st.session_state.get("show_add_form", False):
        st.markdown("---")
        cols = get_table_columns(table)
        
        if not cols:
            st.warning("カラム情報が取得できません。", icon="⚠️")
            return
            
        with st.form("add_form", clear_on_submit=True):
            col_list = [c for c in cols if c.lower() not in ["id","created_at","updated_at"]]
            num_cols = 3
            new = {}
            
            # フォームの入力フィールドを3列に分割して表示
            for i in range(0, len(col_list), num_cols):
                cols_form = st.columns(num_cols)
                for j in range(num_cols):
                    idx = i + j
                    if idx < len(col_list):
                        c = col_list[idx]
                        with cols_form[j]:
                            # 入力キーをテーブル名で一意にする
                            new[c] = st.text_input(c, key=f"add_input_{table}_{c}")
            
            if st.form_submit_button("💾 追加を実行"):
                payload = {k:v for k,v in new.items() if v not in [None,""]}
                if not payload:
                    st.warning("入力されたデータがありません。", icon="⚠️")
                    return
                success, result = execute_operation(supabase, table, "insert", payload)
                if success:
                    st.success("✅ データが正常に追加されました")
                    st.cache_data.clear()
                    st.session_state["show_add_form"] = False
                    st.rerun()
                else:
                    st.error(f"❌ 追加失敗: {result}")
        st.markdown("---")


# --- コア機能: データ選択とフィルタリング ---
def show_data_selection_core(table, key_suffix):
    """
    データ一覧を表示し、フィルタリングと行選択を可能にする。
    選択された行データ(dict)を返す。
    """
    
    # 全データを取得 (最大500件表示)
    df_raw = get_table_data(table, limit=500)
    
    if df_raw is None or df_raw.empty:
        # データがない場合も状態をリセット
        st.session_state.pop(f"selected_row_{key_suffix}", None)
        return None
        
    df = df_raw.copy()
    
    # ID/主キーの列を決定
    id_col = "id" if "id" in df.columns else df.columns[0]
    
    # --- フィルタリング UI ---
    # 検索UI（常時表示：折りたたみなし）
    st.markdown("#### 🔎 検索（テキスト/値 + 日付）")
    cols = df.columns.tolist()
    q1, q2, q3 = st.columns([3, 2, 5])
    with q1:
        quick_col = st.selectbox("項目", cols, key=f"quick_col_{key_suffix}")
    with q2:
        quick_op = st.selectbox("条件", ["含む", "等しい"], key=f"quick_op_{key_suffix}")
    with q3:
        quick_val = st.text_input("検索値", key=f"quick_val_{key_suffix}")
    if quick_val:
        try:
            if quick_op == "等しい":
                df = df[df[quick_col].astype(str) == quick_val]
            else:
                df = df[df[quick_col].astype(str).str.contains(quick_val, case=False, na=False)]
        except Exception:
            st.warning("検索に失敗しました。入力値の型をご確認ください。")

    # 日付フィルタ（必要時のみ、1行でスリムに）
    date_cols = [c for c in df.columns if 'date' in c.lower() or 'at' in c.lower()]
    if date_cols:
        d1, d2, d3 = st.columns(3)
        with d1:
            date_filter_col = st.selectbox("日付項目", date_cols, key=f"date_filter_col_{key_suffix}")
        with d2:
            start_date = st.date_input("開始日", value=None, key=f"start_date_{key_suffix}")
        with d3:
            end_date = st.date_input("終了日", value=None, key=f"end_date_{key_suffix}")
        # 変換して適用
        try:
            df["__temp_date_filter"] = pd.to_datetime(df[date_filter_col], errors='coerce').dt.date
            if start_date or end_date:
                temp_df = df[df["__temp_date_filter"].notna()]
                if start_date:
                    temp_df = temp_df[temp_df["__temp_date_filter"] >= start_date]
                if end_date:
                    temp_df = temp_df[temp_df["__temp_date_filter"] <= end_date]
                df = temp_df
        except Exception:
            pass
        if "__temp_date_filter" in df.columns:
            df = df.drop(columns=["__temp_date_filter"])

    # --- データフレーム（選択可能） ---
    st.caption(f"💡 表示件数: {len(df)}件。行をクリックして選択できます。")
    
    # データテーブル（選択可能）：data_editorで確実に選択できるように
    data_key = f"data_editor_{table}_{key_suffix}"
    st.data_editor(
        df,
        key=data_key,
        use_container_width=True,
        height=280,
        hide_index=True,
        column_order=[id_col] + [c for c in df.columns if c != id_col],
        num_rows="fixed",
        disabled=True,
    )
    
    # 選択された行の処理
    selected_state = st.session_state.get(data_key, {})
    selected_rows = selected_state.get("selection", {}).get("rows", [])
    
    selected_row_data = None
    if selected_rows:
        selected_index = selected_rows[0]
        
        if selected_index < len(df):
            selected_row_data = df.iloc[selected_index].to_dict()
            st.session_state[f"selected_row_{key_suffix}"] = selected_row_data
            # 選択成功メッセージ
            st.success(f"✅ ID **{selected_row_data.get(id_col)}** の行が選択されました。下の「🎯 選択したレコードの操作」セクションをご確認ください。")
        else:
            st.session_state.pop(f"selected_row_{key_suffix}", None) # 無効な選択なら削除
            st.warning("無効な行が選択されました。")
    else:
        # 🌟 修正: 行選択がない場合、セッションステートから情報を確実に削除
        st.session_state.pop(f"selected_row_{key_suffix}", None)
        st.info("☝️ 上の表から操作したい行をクリックしてください。")
        
    st.markdown("---")
    
    # 最終的にセッションステートから最新の状態を取得して返す
    return st.session_state.get(f"selected_row_{key_suffix}")


# --- ヘルパー関数: 編集フォームの表示 ---
def show_edit_form(supabase, table, selected_row, id_col):
    selected_id = selected_row.get(id_col)
    st.markdown(f"#### ✍️ ID: `{selected_id}` の修正フォーム")
    
    # フォーム内で編集
    with st.form(f"edit_form_{selected_id}"):
        df_cols = get_table_columns(table)
        upd = {}
        # ID/Timestamp系カラムはフォームから除外
        col_list = [c for c in df_cols if c.lower() not in ["id","created_at","updated_at"]]
        num_cols = 3 

        # フォームの入力フィールドを3列に分割して表示
        for i in range(0, len(col_list), num_cols):
            cols_form = st.columns(num_cols)
            for j in range(num_cols):
                idx = i + j
                if idx < len(col_list):
                    c = col_list[idx]
                    val = selected_row.get(c, "")
                    # 入力キーはIDを含み一意なので問題なし
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


# --- メイン描画関数 (全機能統合) ---
def show(supabase, available_tables):
    st.markdown("## 📋 データ管理 (統合画面)")
    st.markdown("---")
    
    if not available_tables:
        st.info("テーブルが存在しません。テーブル作成ページで追加してください。", icon="ℹ️")
        return

    # 1. テーブル選択と件数表示
    col_left, col_right = st.columns([4, 1])
    
    default_table = st.session_state.get("selected_table", available_tables[0])
    default_index = available_tables.index(default_table) if default_table in available_tables else 0

    with col_left:
        table = st.selectbox("操作するテーブルを選択", available_tables, index=default_index, key="manage_table")
    
    # 🌟 修正: テーブルが切り替わったら選択状態をリセット
    if table != st.session_state.get("selected_table_actual"):
        st.session_state["selected_table_actual"] = table
        st.cache_data.clear()
        st.session_state.pop("selected_row_main", None) # 選択行を強制的にリセット
        
    df_count = get_table_data(table, limit=500)
    count = df_count.shape[0] if df_count is not None else 0
    
    with col_right:
        st.metric("総件数", f"{count:,}件")
        
    st.markdown("<br>", unsafe_allow_html=True)

    # 2. データ一覧・検索・選択 (コア機能)
    st.markdown("### 📜 データ一覧・検索・選択")
    # show_data_selection_coreはセッションステートから最新の選択行データを取得して返す
    selected_row = show_data_selection_core(table, key_suffix="main")

    # 3. データ追加（要望: 表の下に配置）
    show_add_form_toggle(supabase, table)

    # 4. 編集・削除フォームの表示
    if selected_row:
        # 選択行情報からIDを取得
        df_cols = get_table_columns(table)
        id_col = "id" if "id" in df_cols else df_cols[0]
        selected_id = selected_row.get(id_col)
        
        st.markdown("---")
        st.markdown(f"### 🎯 選択したレコードの操作 (ID: `{selected_id}`)")
        
        # 編集と削除の領域を定義
        edit_col, delete_col = st.columns([2, 1])

        with edit_col:
            show_edit_form(supabase, table, selected_row, id_col)
        
        with delete_col:
            st.markdown("#### 🗑️ 削除警告")
            
            # --- 削除の第一ステップ: 警告と確認ボタン ---
            if st.button(f"🗑️ ID {selected_id} の削除を開始", type="secondary", key=f"init_delete_btn_{selected_id}", use_container_width=True):
                # 削除確認フラグを立てる
                st.session_state["confirm_delete_id"] = selected_id
            
            # --- 削除の第二ステップ: 最終確認フロー ---
            if st.session_state.get("confirm_delete_id") == selected_id:
                st.markdown("---")
                st.error(f"⚠️ **最終確認:** ID `{selected_id}` を削除します。")
                
                col_yes, col_no = st.columns(2)
                
                with col_yes:
                    # 削除実行
                    if st.button("🗑️ 削除を最終確定", type="primary", key=f"final_delete_yes_{selected_id}", use_container_width=True):
                        success, result = execute_operation(supabase, table, "delete", condition=(id_col, selected_id))
                        if success:
                            st.success("✅ データが正常に削除されました")
                            st.session_state.pop("confirm_delete_id", None) # 状態クリア
                            st.session_state.pop("selected_row_main", None) # 選択もクリア
                            st.cache_data.clear()
                            st.rerun() 
                        else:
                            st.error(f"❌ 削除失敗: {result}")
                            st.session_state.pop("confirm_delete_id", None)
                
                with col_no:
                    # キャンセルボタン (ユーザーの言う「✖ボタン」の意図を包含)
                    if st.button("✖ キャンセル", key=f"final_delete_no_{selected_id}", use_container_width=True):
                        st.session_state.pop("confirm_delete_id", None) # 状態クリア
                        st.info("削除をキャンセルしました。")
            else:
                 st.info("👆上のボタンを押すと削除の最終確認が表示されます。")
    else:
        # 選択されていない場合の明確な指示
        st.markdown("""
        ---
        ### 🎯 選択したレコードの操作
        データ一覧から行をクリックして選択すると、ここに**修正フォーム**と**削除オプション**が表示されます。
        """)
