# modules/ui_search.py
import streamlit as st
from .supabase_utils import get_table_columns, get_table_data
from datetime import datetime, date
import pandas as pd

def show(supabase, available_tables):
    """ページネーション型検索画面"""
    
    st.markdown("## 🔍 データ検索")
    st.markdown("---")
    
    if not available_tables:
        st.info("テーブルがありません")
        return
    
    # セッション初期化
    init_session()
    
    # 現在のページ
    current_page = st.session_state["search_page"]
    
    # 進行状況バー
    show_progress_bar(current_page)
    
    # ページ表示
    if current_page == 1:
        page_1_select_table(available_tables)
    elif current_page == 2:
        page_2_join(available_tables)
    elif current_page == 3:
        page_3_conditions(available_tables)
    elif current_page == 4:
        page_4_sort(available_tables)
    elif current_page == 5:
        page_5_execute(supabase)
    elif current_page == 6:
        page_6_result()


def init_session():
    """セッション初期化"""
    defaults = {
        "search_page": 1,
        "search_main_table": None,
        "search_joins": [],
        "search_conditions": [],
        "search_sort_col": None,
        "search_sort_order": "ASC",
        "search_result": None
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def show_progress_bar(current_page):
    """進行状況バー (完了の色味を修正)"""
    steps = ["テーブル", "結合", "条件", "並び替え", "実行", "結果"]
    # 添付画像のようなグラデーションのキーカラーをイメージ
    colors = [
        ("linear-gradient(135deg, #667eea 0%, #764ba2 100%)", "#764ba2"), # テーブル: 紫
        ("linear-gradient(135deg, #fce38a 0%, #f38181 100%)", "#f38181"), # 結合: オレンジ/ピンク
        ("linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", "#f5576c"), # 条件: ピンク/赤
        ("linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", "#00f2fe"), # 並び替え: 水色/青
        ("linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", "#38ef7d"), # 実行: 緑
        ("linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", "#00f2fe")  # 結果: 水色
    ]
    
    # 完了時の背景色をモダンなターコイズグリーン系に変更
    COMPLETED_COLOR = "#38ef7d" 
    
    cols = st.columns(6)
    
    for idx, (col, label) in enumerate(zip(cols, steps)):
        page_num = idx + 1
        active_color = colors[idx][1]
        
        with col:
            if page_num < current_page:
                # 修正後の完了色
                st.markdown(f"<div style='text-align:center; padding:8px; background:{COMPLETED_COLOR}; color:white; border-radius:5px; font-size:12px; font-weight:bold;'>✓ {label}</div>", unsafe_allow_html=True)
            elif page_num == current_page:
                # 現在 (グラデーションの最終色に近いもので代用)
                st.markdown(f"<div style='text-align:center; padding:8px; background:{active_color}; color:white; border-radius:5px; font-size:12px; font-weight:bold;'>▶ {label}</div>", unsafe_allow_html=True)
            else:
                # 未実施
                st.markdown(f"<div style='text-align:center; padding:8px; background:#e0e0e0; color:#999; border-radius:5px; font-size:12px;'>{label}</div>", unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)


def page_1_select_table(available_tables):
    """ページ1: テーブル選択"""
    
    st.markdown("### 📋 どのテーブルを検索しますか？")
    
    current_table = st.session_state.get("search_main_table")
    index = available_tables.index(current_table) if current_table in available_tables else 0
    
    main_table = st.selectbox(
        "テーブル",
        available_tables,
        index=index,
        key="p1_table"
    )
    
    # テーブルが変わった場合、結合と条件をリセット
    if st.session_state["search_main_table"] != main_table:
        st.session_state["search_joins"] = []
        st.session_state["search_conditions"] = []
    
    st.session_state["search_main_table"] = main_table
    
    # 項目取得
    columns = get_table_columns(main_table)
    
    if columns:
        st.success(f"✅ **{len(columns)}** 個の項目")
        
        # データプレビューを画面中央に、より大きく（ドーンと）表示するため、カラム比率を [1, 8, 1] に変更
        col_left, col_center, col_right = st.columns([1, 8, 1]) 
        
        # col_left と col_right は空けて中央寄せの余白とする
        with col_left:
             st.markdown(" ")

        with col_center:
            # データプレビューを大きく中央表示
            with st.expander("📊 データプレビュー", expanded=True):
                df = get_table_data(main_table, limit=3)
                if not df.empty:
                    # use_container_width=True で col_center の幅いっぱいを使用
                    st.dataframe(df, hide_index=True, use_container_width=True)
                else:
                    st.info("データなし")
        
        with col_right:
             st.markdown(" ")
    
    st.markdown("<br><br>", unsafe_allow_html=True)
    
    # ナビゲーション
    col1, col2, col3 = st.columns([1, 1, 1])
    with col2:
        if st.button("次へ ▶️", use_container_width=True, type="primary"):
            st.session_state["search_page"] = 2
            st.rerun()


def page_2_join(available_tables):
    """ページ2: 結合設定 (結合必須のバリデーションを追加)"""
    
    st.markdown("### 🔗 他のテーブルと結合しますか？")
    st.caption("しなくてもOKです。スキップできます。")
    
    main_table = st.session_state["search_main_table"]
    
    # 結合が設定されているかどうかに関わらず、結合設定UIは表示する
    use_join = st.checkbox("結合する", value=len(st.session_state.get("search_joins", [])) > 0 or "join_table_temp" in st.session_state)
    
    if use_join:
        st.markdown("---")
        
        other_tables = [t for t in available_tables if t != main_table]
        
        if other_tables:
            # 結合設定のUIに一時的なセッションステートを使用
            if "join_table_temp" not in st.session_state:
                st.session_state["join_table_temp"] = other_tables[0]
            if "join_type_temp" not in st.session_state:
                st.session_state["join_type_temp"] = "両方にあるデータ"
            
            col1, col2 = st.columns(2)
            
            with col1:
                join_table = st.selectbox(
                    "結合するテーブル", 
                    other_tables, 
                    index=other_tables.index(st.session_state.get("join_table_temp", other_tables[0])),
                    key="join_table_temp" # セッションステートに保存
                )
            
            with col2:
                join_type = st.selectbox(
                    "方法", 
                    ["両方にあるデータ", "メインの全データ", "結合先の全データ"],
                    index=["両方にあるデータ", "メインの全データ", "結合先の全データ"].index(st.session_state.get("join_type_temp", "両方にあるデータ")),
                    key="join_type_temp" # セッションステートに保存
                )
            
            st.markdown("---")
            
            # ... (データ確認部分は省略なし) ...
            
            # 両方のテーブルのデータを表示
            st.markdown("### 📊 テーブルのデータ確認")
            
            data_col1, data_col2 = st.columns(2)
            
            with data_col1:
                st.markdown(f"**{main_table}**")
                with st.spinner("データ取得中..."):
                    try:
                        main_df = get_table_data(main_table, limit=5)
                        if not main_df.empty:
                            st.dataframe(main_df, use_container_width=True, hide_index=True, height=200)
                        else:
                            st.info("データなし")
                    except Exception as e:
                        st.error(f"エラー: {e}")
            
            with data_col2:
                st.markdown(f"**{join_table}**")
                with st.spinner("データ取得中..."):
                    try:
                        join_df = get_table_data(join_table, limit=5)
                        if not join_df.empty:
                            st.dataframe(join_df, use_container_width=True, hide_index=True, height=200)
                        else:
                            st.info("データなし")
                    except Exception as e:
                        st.error(f"エラー: {e}")
            
            st.markdown("---")
            st.markdown("### 🔗 結合する項目")
            
            main_cols = get_table_columns(main_table)
            join_cols = get_table_columns(join_table)
            
            # Selectboxの初期値設定ロジックを調整
            # (ただし、キーの選択は結合が追加されるまで一時的なものでも問題ないため、ここではデフォルトのキーを使用)
            
            col_m, col_arrow, col_j = st.columns([2, 1, 2])
            
            with col_m:
                st.markdown(f"**{main_table}**")
                main_key = st.selectbox("項目", main_cols, label_visibility="collapsed", key="join_main_key_select")
            
            with col_arrow:
                st.markdown("<br>", unsafe_allow_html=True)
                st.markdown("<div style='text-align:center; font-size:40px;'>🔗</div>", unsafe_allow_html=True)
            
            with col_j:
                st.markdown(f"**{join_table}**")
                join_key = st.selectbox("項目", join_cols, label_visibility="collapsed", key="join_join_key_select")
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            col_add1, col_add2, col_add3 = st.columns([1, 2, 1])
            with col_add2:
                if st.button("➕ この結合を追加", use_container_width=True, type="secondary"):
                    type_map = {
                        "両方にあるデータ": "INNER JOIN",
                        "メインの全データ": "LEFT JOIN",
                        "結合先の全データ": "RIGHT JOIN"
                    }
                    st.session_state["search_joins"].append({
                        "join_table": join_table,
                        "join_type": type_map[join_type],
                        "main_key": main_key,
                        "join_key": join_key,
                        "description": f"{main_table}.{main_key}={join_table}.{join_key}"
                    })
                    st.success("✅ 追加しました")
                    # 一時的なセッションステートはリセットしない (次の追加で同じものがデフォルトになるため)
                    st.rerun()
        
    # 追加済み結合
    if st.session_state["search_joins"]:
        st.markdown("---")
        st.markdown("### 📝 設定済みの結合")
        for idx, j in enumerate(st.session_state["search_joins"]):
            col_info, col_del = st.columns([5, 1])
            with col_info:
                st.markdown(
                    f'<div style="background: #e3f2fd; padding: 12px; border-radius: 8px; border-left: 4px solid #2196f3;">'
                    f'<strong>{idx+1}.</strong> <code>{j["description"]}</code> （{j["join_type"]}）'
                    f'</div>',
                    unsafe_allow_html=True
                )
            with col_del:
                if st.button("🗑️", key=f"deljoin{idx}"):
                    st.session_state["search_joins"].pop(idx)
                    st.rerun()
            st.markdown("<br>", unsafe_allow_html=True)
    
    st.markdown("<br><br>", unsafe_allow_html=True)
    
    # ナビゲーション（高さ統一）
    col1, col2, col3 = st.columns(3)
    
    can_proceed = True
    
    # 🌟 修正ロジック: 結合をONにしていて、結合が一つもない場合は進めない
    if use_join and not st.session_state["search_joins"]:
        can_proceed = False
        with col3:
            st.button("次へ ▶️", use_container_width=True, disabled=True, key="next2_disabled")
        # ユーザーへのフィードバック
        st.warning("⚠️ **「この結合を追加」**ボタンを押して、結合を1つ以上設定してください。")
    
    # 🌟 結合が不要、または結合が設定されている場合は進める
    if can_proceed:
        with col3:
            if st.button("次へ ▶️", use_container_width=True, type="primary", key="next2_valid"):
                st.session_state["search_page"] = 3
                st.rerun()

    # 戻るボタン
    with col1:
        if st.button("◀️ 戻る", use_container_width=True, key="back2"):
            st.session_state["search_page"] = 1
            st.rerun()


def page_3_conditions(available_tables):
    """ページ3: 条件設定"""
    
    st.markdown("### 🔍 どんな条件で絞り込みますか？")
    
    main_table = st.session_state["search_main_table"]
    tables = [main_table] + [j["join_table"] for j in st.session_state["search_joins"]]
    
    cond_type = st.radio("条件タイプ", ["値で検索", "日付で検索", "空で検索"], horizontal=True)
    
    st.markdown("---")
    
    if cond_type == "値で検索":
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            tbl = st.selectbox("テーブル", tables, key="c_tbl")
        
        cols = get_table_columns(tbl)
        
        with col2:
            col_name = st.selectbox("項目", cols, key="c_col")
        
        with col3:
            op = st.selectbox("条件", ["等しい", "含む", ">", "<", ">=", "<="], key="c_op")
        
        with col4:
            val = st.text_input("値", key="c_val")
        
        if st.button("➕ 追加", key="add_val"):
            if val:
                st.session_state["search_conditions"].append({
                    "type": "value",
                    "table": tbl,
                    "column": col_name,
                    "operator": op,
                    "value": val
                })
                st.success("追加")
                st.rerun()
    
    elif cond_type == "日付で検索":
        col1, col2 = st.columns(2)
        
        with col1:
            tbl = st.selectbox("テーブル", tables, key="d_tbl")
        
        cols = get_table_columns(tbl)
        
        with col2:
            col_name = st.selectbox("日付項目", cols, key="d_col")
        
        st.markdown("**期間:**")
        
        today = date.today()
        
        quick_cols = st.columns(5)
        with quick_cols[0]:
            if st.button("今日"):
                add_date_cond(tbl, col_name, today, today, "今日")
        with quick_cols[1]:
            if st.button("今週"):
                start = today - pd.Timedelta(days=today.weekday())
                add_date_cond(tbl, col_name, start, today, "今週")
        with quick_cols[2]:
            if st.button("今月"):
                start = today.replace(day=1)
                add_date_cond(tbl, col_name, start, today, "今月")
        with quick_cols[3]:
            if st.button("先月"):
                end = today.replace(day=1) - pd.Timedelta(days=1)
                start = end.replace(day=1)
                add_date_cond(tbl, col_name, start, end, "先月")
        with quick_cols[4]:
            if st.button("過去30日"):
                start = today - pd.Timedelta(days=30)
                add_date_cond(tbl, col_name, start, today, "過去30日")
        
        st.markdown("**または指定:**")
        col_s, col_e = st.columns(2)
        with col_s:
            start = st.date_input("開始", today - pd.Timedelta(days=30), key="d_start")
        with col_e:
            end = st.date_input("終了", today, key="d_end")
        
        if st.button("➕ 追加", key="add_date"):
            add_date_cond(tbl, col_name, start, end, f"{start}~{end}")
    
    elif cond_type == "空で検索":
        col1, col2 = st.columns(2)
        
        with col1:
            tbl = st.selectbox("テーブル", tables, key="n_tbl")
        
        cols = get_table_columns(tbl)
        
        with col2:
            col_name = st.selectbox("項目", cols, key="n_col")
        
        col_n1, col_n2 = st.columns(2)
        
        with col_n1:
            if st.button("❌ 空", use_container_width=True):
                st.session_state["search_conditions"].append({
                    "type": "null",
                    "table": tbl,
                    "column": col_name,
                    "operator": "IS NULL",
                    "value": "",
                    "description": f"{tbl}.{col_name}が空"
                })
                st.rerun()
        
        with col_n2:
            if st.button("✅ 空でない", use_container_width=True):
                st.session_state["search_conditions"].append({
                    "type": "not_null",
                    "table": tbl,
                    "column": col_name,
                    "operator": "IS NOT NULL",
                    "value": "",
                    "description": f"{tbl}.{col_name}が空でない"
                })
                st.rerun()
    
    # 設定済み条件
    if st.session_state["search_conditions"]:
        st.markdown("---")
        st.markdown("**設定済み条件:**")
        for idx, cond in enumerate(st.session_state["search_conditions"]):
            col_info, col_del = st.columns([4, 1])
            with col_info:
                if cond.get("description"):
                    desc = cond["description"]
                elif cond["type"] == "value":
                    desc = f"{cond['table']}.{cond['column']} {cond['operator']} {cond['value']}"
                else:
                    desc = str(cond)
                st.markdown(f"{idx+1}. {desc}")
            with col_del:
                if st.button("🗑️", key=f"delcond{idx}"):
                    st.session_state["search_conditions"].pop(idx)
                    st.rerun()
    
    st.markdown("<br><br>", unsafe_allow_html=True)
    
    # ナビゲーション
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("◀️ 戻る", use_container_width=True, key="back3"):
            st.session_state["search_page"] = 2
            st.rerun()
    with col3:
        if st.button("次へ ▶️", use_container_width=True, type="primary", key="next3"):
            st.session_state["search_page"] = 4
            st.rerun()


def page_4_sort(available_tables):
    """ページ4: 並び替え"""
    
    st.markdown("### 📊 並び替えますか？")
    
    main_table = st.session_state["search_main_table"]
    all_cols = get_table_columns(main_table)
    
    for j in st.session_state["search_joins"]:
        j_cols = get_table_columns(j["join_table"])
        all_cols.extend([f"{j['join_table']}.{c}" for c in j_cols])
    
    col1, col2 = st.columns(2)
    
    # 初期値の設定
    current_sort_col = st.session_state.get("search_sort_col")
    sort_options = ["なし"] + all_cols
    default_index = sort_options.index(current_sort_col) if current_sort_col in sort_options else 0
    
    with col1:
        sort_col = st.selectbox("項目", sort_options, index=default_index, key="sort_col_select")
    
    order_options = ["⬆️ 昇順", "⬇️ 降順"]
    default_order = "⬇️ 降順" if st.session_state.get("search_sort_order") == "DESC" else "⬆️ 昇順"
    
    with col2:
        sort_order = st.selectbox("順序", order_options, index=order_options.index(default_order), key="sort_order_select")
    
    st.session_state["search_sort_col"] = sort_col if sort_col != "なし" else None
    st.session_state["search_sort_order"] = "DESC" if "降順" in sort_order else "ASC"
    
    st.markdown("<br><br>", unsafe_allow_html=True)
    
    # ナビゲーション
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("◀️ 戻る", use_container_width=True, key="back4"):
            st.session_state["search_page"] = 3
            st.rerun()
    with col3:
        if st.button("実行 ▶️", use_container_width=True, type="primary", key="exec"):
            st.session_state["search_page"] = 5
            st.rerun()


def page_5_execute(supabase):
    """ページ5: 実行 (設定確認を添付画像の色味のシンプルなボックスに変更)"""
    
    st.markdown("### 🚀 検索を実行します")
    
    # 設定確認（添付画像のような色味のグラデーション）
    st.markdown("**設定内容:**")
    
    info_cols = st.columns(4)
    
    main_table = st.session_state["search_main_table"]
    join_count = len(st.session_state["search_joins"])
    cond_count = len(st.session_state["search_conditions"])
    sort_text = st.session_state["search_sort_col"] or "なし"
    sort_order_text = "⬇️ 降順" if st.session_state["search_sort_order"] == "DESC" and sort_text != "なし" else "⬆️ 昇順"
    
    # テーブル: 紫
    with info_cols[0]:
        st.markdown(
            '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); '
            'padding: 15px; border-radius: 10px; text-align: center;">'
            f'<div style="color: #ddd; font-size: 12px;">テーブル</div>'
            f'<div style="color: white; font-size: 18px; font-weight: bold; margin-top: 5px;">{main_table}</div>'
            '</div>',
            unsafe_allow_html=True
        )
    
    # 結合: オレンジ/ピンク
    with info_cols[1]:
        st.markdown(
            '<div style="background: linear-gradient(135deg, #fce38a 0%, #f38181 100%); '
            'padding: 15px; border-radius: 10px; text-align: center;">'
            f'<div style="color: #555; font-size: 12px;">結合</div>'
            f'<div style="color: #555; font-size: 18px; font-weight: bold; margin-top: 5px;">{join_count} 件</div>'
            '</div>',
            unsafe_allow_html=True
        )
    
    # 条件: ピンク/赤
    with info_cols[2]:
        st.markdown(
            '<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); '
            'padding: 15px; border-radius: 10px; text-align: center;">'
            f'<div style="color: white; font-size: 12px;">条件</div>'
            f'<div style="color: white; font-size: 18px; font-weight: bold; margin-top: 5px;">{cond_count} 件</div>'
            '</div>',
            unsafe_allow_html=True
        )
    
    # 並び替え: 水色/青
    with info_cols[3]:
        st.markdown(
            '<div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); '
            'padding: 15px; border-radius: 10px; text-align: center;">'
            f'<div style="color: white; font-size: 12px;">並び替え</div>'
            f'<div style="color: white; font-size: 18px; font-weight: bold; margin-top: 5px;">{sort_text} {sort_order_text if sort_text != "なし" else ""}</div>'
            '</div>',
            unsafe_allow_html=True
        )
    
    st.markdown("<br><br>", unsafe_allow_html=True)
    
    # 実行ボタン（中央、戻るボタンと高さを揃える）
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("◀️ 戻る", use_container_width=True, key="back5"):
            st.session_state["search_page"] = 4
            st.rerun()
    
    with col3:
        # 検索実行ボタンを緑系で目立つように設定
        if st.button("🔍 検索実行", use_container_width=True, type="primary", key="exec_btn"):
            with st.spinner("検索中..."):
                if st.session_state["search_joins"]:
                    execute_join_search(supabase)
                else:
                    execute_simple_search(supabase)
                
                st.session_state["search_page"] = 6
                st.rerun()


def page_6_result():
    """ページ6: 結果表示"""
    
    result = st.session_state.get("search_result")
    
    if not result:
        st.warning("結果がありません")
        return
    
    if result["count"] > 0:
        # 成功メッセージ（中央）
        col_left, col_center, col_right = st.columns([1, 3, 1])
        
        with col_center:
            st.markdown(
                f'<div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); '
                f'padding: 30px; border-radius: 15px; text-align: center; box-shadow: 0 8px 25px rgba(56, 239, 125, 0.3); margin-bottom: 30px;">'
                f'<div style="font-size: 64px;">🎉</div>'
                f'<div style="color: white; font-size: 32px; font-weight: bold; margin-top: 10px;">見つかりました！</div>'
                f'<div style="color: white; font-size: 48px; font-weight: 700; margin-top: 15px;">{result["count"]:,} 件</div>'
                f'</div>',
                unsafe_allow_html=True
            )
        
        # 統計情報（おしゃれに）
        stat_cols = st.columns(3)
        
        df = pd.DataFrame(result["data"])
        
        with stat_cols[0]:
            st.markdown(
                '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); '
                'padding: 20px; border-radius: 10px; text-align: center;">'
                '<div style="color: white; font-size: 14px;">データ件数</div>'
                f'<div style="color: white; font-size: 32px; font-weight: bold; margin-top: 8px;">{len(df):,}</div>'
                '</div>',
                unsafe_allow_html=True
            )
        
        with stat_cols[1]:
            st.markdown(
                '<div style="background: linear-gradient(135deg, #fce38a 0%, #f38181 100%); '
                'padding: 20px; border-radius: 10px; text-align: center;">'
                '<div style="color: #555; font-size: 14px;">項目数</div>'
                f'<div style="color: #555; font-size: 32px; font-weight: bold; margin-top: 8px;">{len(df.columns)}</div>'
                '</div>',
                unsafe_allow_html=True
            )
        
        with stat_cols[2]:
            st.markdown(
                '<div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); '
                'padding: 20px; border-radius: 10px; text-align: center;">'
                '<div style="color: white; font-size: 14px;">テーブル</div>'
                f'<div style="color: white; font-size: 20px; font-weight: bold; margin-top: 8px;">{result["table"]}</div>'
                '</div>',
                unsafe_allow_html=True
            )
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        # データテーブル（中央に横長）
        st.dataframe(df, use_container_width=True, height=450, hide_index=True)
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        # ダウンロードボタン（中央）
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            csv = df.to_csv(index=False, encoding="utf-8-sig")
            st.download_button(
                "📥 CSV でダウンロード",
                csv,
                f"search_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                use_container_width=True,
                type="primary"
            )
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        # おまけ: SQL（コンパクト）
        with st.expander("🔧 おまけ: 生成されたSQL（技術者向け）"):
            sql = generate_sql()
            st.code(sql, language="sql")
            st.text_area("コピー用", sql, height=150, label_visibility="collapsed")
    
    else:
        # 見つからなかった場合
        col_left, col_center, col_right = st.columns([1, 2, 1])
        
        with col_center:
            st.markdown(
                '<div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); '
                'padding: 40px; border-radius: 15px; text-align: center;">'
                '<div style="font-size: 64px;">🔍</div>'
                '<div style="color: #5e4a3b; font-size: 28px; font-weight: bold; margin-top: 15px;">見つかりませんでした</div>'
                '<div style="color: #8b6e58; font-size: 16px; margin-top: 10px;">条件を変えて再度検索してみてください</div>'
                '</div>',
                unsafe_allow_html=True
            )
    
    st.markdown("<br><br>", unsafe_allow_html=True)
    
    # 新しい検索ボタン（中央）
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        if st.button("🔄 新しい検索を開始", use_container_width=True, type="primary"):
            for key in list(st.session_state.keys()):
                if key.startswith("search_"):
                    del st.session_state[key]
            st.rerun()


def add_date_cond(table, column, start, end, desc):
    """日付条件追加"""
    st.session_state["search_conditions"].append({
        "type": "date_range",
        "table": table,
        "column": column,
        "start": start.isoformat(),
        "end": end.isoformat(),
        "description": f"{table}.{column}が{desc}"
    })
    st.success("追加")
    st.rerun()


def execute_simple_search(supabase):
    """簡単な検索実行"""
    try:
        table = st.session_state["search_main_table"]
        query = supabase.table(table).select("*")
        
        # 条件適用
        for cond in st.session_state["search_conditions"]:
            col = cond["column"]
            
            if cond["type"] == "value":
                op_map = {"等しい": "eq", "含む": "ilike", ">": "gt", "<": "lt", ">=": "gte", "<=": "lte"}
                op = op_map[cond["operator"]]
                val = cond["value"]
                
                if op == "ilike":
                    query = query.ilike(col, f"%{val}%")
                else:
                    query = getattr(query, op)(col, val)
            
            elif cond["type"] == "date_range":
                query = query.gte(col, cond["start"]).lte(col, cond["end"])
            
            elif cond["type"] in ["null", "not_null"]:
                if cond["operator"] == "IS NULL":
                    query = query.is_(col, None)
                else:
                    query = query.not_.is_(col, None)
        
        # 並び替え
        if st.session_state["search_sort_col"]:
            query = query.order(st.session_state["search_sort_col"], desc=(st.session_state["search_sort_order"] == "DESC"))
        
        response = query.limit(10000).execute()
        
        st.session_state["search_result"] = {
            "data": response.data if hasattr(response, "data") else [],
            "count": len(response.data) if hasattr(response, "data") and response.data else 0,
            "table": table
        }
    
    except Exception as e:
        st.error(f"エラー: {e}")


def execute_join_search(supabase):
    """結合検索実行"""
    try:
        main_table = st.session_state["search_main_table"]
        
        # メインデータ取得
        main_query = supabase.table(main_table).select("*")
        
        for cond in st.session_state["search_conditions"]:
            if cond.get("table") != main_table:
                continue
            
            col = cond["column"]
            
            if cond["type"] == "value":
                op_map = {"等しい": "eq", "含む": "ilike", ">": "gt", "<": "lt", ">=": "gte", "<=": "lte"}
                op = op_map[cond["operator"]]
                val = cond["value"]
                
                if op == "ilike":
                    main_query = main_query.ilike(col, f"%{val}%")
                else:
                    main_query = getattr(main_query, op)(col, val)
        
        main_response = main_query.limit(10000).execute()
        main_df = pd.DataFrame(main_response.data if hasattr(main_response, "data") else [])
        
        if main_df.empty:
            st.session_state["search_result"] = {"data": [], "count": 0, "table": main_table}
            return
        
        # 結合
        result_df = main_df
        
        for join in st.session_state["search_joins"]:
            join_query = supabase.table(join["join_table"]).select("*")
            join_response = join_query.limit(10000).execute()
            join_df = pd.DataFrame(join_response.data if hasattr(join_response, "data") else [])
            
            if not join_df.empty:
                how_map = {"INNER JOIN": "inner", "LEFT JOIN": "left", "RIGHT JOIN": "right"}
                how = how_map.get(join["join_type"], "inner")
                
                result_df = result_df.merge(
                    join_df,
                    left_on=join["main_key"],
                    right_on=join["join_key"],
                    how=how,
                    suffixes=("", f"_{join['join_table']}")
                )
        
        st.session_state["search_result"] = {
            "data": result_df.to_dict('records'),
            "count": len(result_df),
            "table": f"{main_table} (結合)"
        }
    
    except Exception as e:
        st.error(f"エラー: {e}")


def generate_sql():
    """SQL生成"""
    table = st.session_state["search_main_table"]
    sql = [f"SELECT * FROM {table}"]
    
    # JOIN
    for j in st.session_state["search_joins"]:
        sql.append(f"{j['join_type']} {j['join_table']} ON {table}.{j['main_key']}={j['join_table']}.{j['join_key']}")
    
    # WHERE
    where_parts = []
    for cond in st.session_state["search_conditions"]:
        col = f"{cond['table']}.{cond['column']}"
        
        if cond["type"] == "value":
            op_map = {"等しい": "=", "含む": "LIKE", ">": ">", "<": "<", ">=": ">=", "<=": "<="}
            op = op_map[cond["operator"]]
            val = cond["value"]
            
            if op == "LIKE":
                where_parts.append(f"{col} LIKE '%{val}%'")
            else:
                where_parts.append(f"{col} {op} '{val}'")
        
        elif cond["type"] == "date_range":
            where_parts.append(f"{col} >= '{cond['start']}'")
            where_parts.append(f"{col} <= '{cond['end']}'")
        
        elif cond["type"] in ["null", "not_null"]:
            where_parts.append(f"{col} {cond['operator']}")
    
    if where_parts:
        sql.append("WHERE " + " AND ".join(where_parts))
    
    # ORDER BY
    if st.session_state["search_sort_col"]:
        sql.append(f"ORDER BY {st.session_state['search_sort_col']} {st.session_state['search_sort_order']}")
    
    sql.append("LIMIT 10000;")
    
    return "\n".join(sql)