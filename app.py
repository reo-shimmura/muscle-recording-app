# app.py - Streamlit UI & Connection Management

import streamlit as st
import pandas as pd
import plotly.express as px
from datetime import date
import datetime as dt
import os
import pathlib
import gspread # 【追加】gspreadをapp.pyでインポート

from database import (
    insert_record, fetch_all_records, update_record, delete_record,
    insert_image, fetch_images_by_date, fetch_all_dates_with_images,
    insert_goal, fetch_all_goals, delete_goal
)
from streamlit_calendar import calendar
from streamlit_image_comparison import image_comparison

# --- 接続設定 ---
SPREADSHEET_NAME = "筋トレ記録アプリ DB" 

@st.cache_resource(show_spinner=False)
def get_gspread_client():
    import gspread
    sa = st.secrets.get("gcp_service_account")
    client = gspread.service_account_from_dict(sa)
    return client

client = get_gspread_client()

# --- 初期設定 ---
st.set_page_config(page_title="筋トレ記録アプリ", layout="wide")

st.markdown("""
    <style>
    /* モバイル表示の調整 */
    [data-testid="stForm"] {padding: 0.5rem !important;}
    [data-testid="stDataFrame"] {overflow-x: auto !important;}
    div.block-container {padding-top: 1rem; padding-bottom: 1rem;}
    </style>
""", unsafe_allow_html=True)

# 画像フォルダのローカルパス定義 (Streamlit Cloudでは永続化されないため注意)
BASE_DIR = pathlib.Path(__file__).parent
IMAGE_DIR = BASE_DIR / "images"
os.makedirs(IMAGE_DIR, exist_ok=True)

st.title("筋トレ記録・管理アプリ")

# 接続失敗時は処理を停止
if client is None:
    st.stop()
    
# --- データ取得 ---
df = fetch_all_records_df(client, SPREADSHEET_NAME)
goals = fetch_all_goals(client, SPREADSHEET_NAME)

if len(df) > 0:
    df["ID"] = pd.to_numeric(df["ID"], errors='coerce').astype('Int64')
    df["重量(kg)"] = pd.to_numeric(df["重量(kg)"], errors='coerce')
    df["回数"] = pd.to_numeric(df["回数"], errors='coerce').astype('Int64')
    df["セット数"] = pd.to_numeric(df["セット数"], errors='coerce').astype('Int64')

# --- 入力フォーム ---
st.header("トレーニング記録を追加")
with st.form("record_form"):
    record_date = st.date_input("日付", date.today())
    
    # 種目入力の効率化 (改善案D)
    unique_exercises = sorted(df["種目"].unique().tolist()) if len(df) > 0 else []
    
    exercise_choice = st.selectbox(
        "種目を選択 (または手動入力)", 
        options=["--- 新規入力 ---"] + unique_exercises,
        key="record_select_exercise_key"
    )
    if exercise_choice == "--- 新規入力 ---":
        exercise = st.text_input("種目名を入力（例：ベンチプレス）", key="record_new_exercise_key")
    else:
        exercise = exercise_choice
    
    weight = st.number_input("重量 (kg)", min_value=0.0, step=1.0)
    reps = st.number_input("回数", min_value=1, step=1)
    sets = st.number_input("セット数", min_value=1, step=1, value=3)
    memo = st.text_area("メモ（任意）")
    submitted = st.form_submit_button("記録する")

    if submitted:
        if exercise and exercise.strip():
            # 【修正】clientとSPREADSHEET_NAMEを渡す
            insert_record(client, SPREADSHEET_NAME, record_date.isoformat(), exercise, weight, reps, sets, memo)
            st.success("✅ 記録を保存しました！")
            st.rerun()

# --- 目標設定 ---
st.header("目標設定")
with st.expander("目標を追加・管理", expanded=False):
    with st.form("goal_form"):
        
        # 記録されたユニークな種目を取得
        # 記録がない場合は、ダミーデータでselectboxが空にならないようにする
        unique_goal_exercises = sorted(df["種目"].unique().tolist()) if len(df) > 0 else ["ベンチプレス", "スクワット"]
        
        goal_exercise = st.selectbox("対象種目", unique_goal_exercises, key="goal_exercise")
        
        col_type, col_value = st.columns(2)
        with col_type:
            goal_period_type = st.selectbox("期間の種類", ["weekly (毎週)", "monthly (毎月)"], key="goal_period_type")
        with col_value:
            goal_target_type = st.selectbox("目標の基準", ["セット数"], key="goal_target_type")
            
        goal_value = st.number_input("目標値（総セット数）", min_value=1, step=1, value=15)
        goal_start_date = st.date_input("目標開始日", date.today())
        
        goal_submitted = st.form_submit_button("目標を設定する")

        if goal_submitted:
            period_type_db = "weekly" if "weekly" in goal_period_type else "monthly"
            target_type_db = "sets"
            
            # 【修正】clientとSPREADSHEET_NAMEを渡す
            insert_goal(client, SPREADSHEET_NAME, goal_exercise, period_type_db, target_type_db, goal_value, goal_start_date.isoformat())
            st.success(f"✅ 目標「{goal_exercise} ({goal_value} {target_type_db})」を設定しました！")
            st.rerun()

    # 設定済みの目標を表示・削除
    if len(goals) > 0:
        st.subheader("現在の設定目標")
        goals_df = pd.DataFrame(goals, columns=["ID", "種目", "期間", "基準", "目標値", "開始日"])
        goals_df["ID"] = pd.to_numeric(goals_df["ID"], errors='coerce').astype('Int64')
        goals_df = goals_df.set_index("ID")
        st.dataframe(goals_df, use_container_width=True)
        
        delete_goal_id = st.number_input("削除する目標のID", min_value=0, step=1)
        if st.button("目標を削除"):
            if delete_goal_id in goals_df.index:
                 # 【修正】clientとSPREADSHEET_NAMEを渡す
                delete_goal(client, SPREADSHEET_NAME, delete_goal_id)
                st.success(f"ID: {delete_goal_id} の目標を削除しました。")
                st.rerun()
            else:
                st.error("指定されたIDの目標が見つかりません。")

# --- 目標達成率の可視化 (ロジックは変更なし) ---
st.header("目標達成の進捗")
# ... (既存の達成率計算と表示ロジックをここに続ける) ...

def get_period_dates(start_date_str, period_type):
    """目標の開始日から現在の期間（今週/今月）の範囲を計算する"""
    start_date = dt.datetime.strptime(start_date_str, '%Y-%m-%d').date()
    today = date.today()
    
    if start_date > today: return None, None
    
    if period_type == "weekly":
        current_period_start = today - dt.timedelta(days=today.weekday())
        current_period_end = current_period_start + dt.timedelta(days=6)
        
    elif period_type == "monthly":
        current_period_start = date(today.year, today.month, 1)
        if today.month == 12:
            current_period_end = date(today.year + 1, 1, 1) - dt.timedelta(days=1)
        else:
            current_period_end = date(today.year, today.month + 1, 1) - dt.timedelta(days=1)
    
    if current_period_start < start_date:
        current_period_start = start_date

    return current_period_start, current_period_end

if len(goals) == 0:
    st.info("目標が設定されていません。目標を追加してください。")
else:
    goals_df = pd.DataFrame(goals, columns=["ID", "種目", "期間", "基準", "目標値", "開始日"])
    goals_df["目標値"] = pd.to_numeric(goals_df["目標値"], errors='coerce')
    
    for _, goal in goals_df.iterrows():
        exercise = goal["種目"]
        period_type = goal["期間"]
        target_value = goal["目標値"]
        start_date_str = goal["開始日"]
        
        start_of_period, end_of_period = get_period_dates(start_date_str, period_type)

        if start_of_period is None:
             st.markdown(f"**{exercise}** ({period_type}目標: {int(target_value)}セット)")
             st.info(f"目標開始日（{start_date_str}）が未来のため、計測を開始していません。")
             continue

        df_filtered_date = df[
            (pd.to_datetime(df["日付"]).dt.date >= start_of_period) & 
            (pd.to_datetime(df["日付"]).dt.date <= end_of_period)
        ]
        
        df_filtered_goal = df_filtered_date[df_filtered_date["種目"] == exercise]
        
        achieved_value = df_filtered_goal["セット数"].sum()
        
        achievement_rate = achieved_value / target_value if target_value > 0 else 0
        display_rate = min(achievement_rate, 1.0) 
        
        st.markdown(f"**{exercise}** ({period_type}目標: {int(target_value)}セット)")
        st.caption(f"計測期間: {start_of_period.isoformat()} 〜 {end_of_period.isoformat()}")

        st.progress(display_rate, text=f"達成率: {achieved_value:.0f} / {target_value:.0f} セット ({display_rate:.1%})")

        if achievement_rate >= 1.0:
            st.balloons()
            st.success("🏆 目標達成おめでとうございます！")

# --- カレンダー表示 (ロジックは変更なし) ---
st.header("カレンダー")
# ... (既存のコード) ...

# --- 選択日の表示（編集・削除機能を含む） ---
st.header("記録詳細")
selected_date = st.date_input("日付を選択して詳細を表示", date.today())
day_df = df[df["日付"] == selected_date.isoformat()].set_index("ID")
# day_images = fetch_images_by_date(client, SPREADSHEET_NAME, selected_date.isoformat()) # (画像は動作しない)

# ... (既存の編集・削除ロジック) ...
if len(day_df) > 0:
    st.subheader(f"{selected_date} のトレーニング記録")

    display_df = day_df.drop(columns=["日付", "メモ"], errors='ignore')
    st.dataframe(display_df, use_container_width=True)

    st.write("---")
    st.markdown("**操作**")
    cols_count = len(day_df)
    cols = st.columns(cols_count)
    
    for i, (record_id, row) in enumerate(day_df.iterrows()):
        with cols[i]:
            if st.button(f"編集 ({row['種目']})", key=f"edit_btn_{record_id}"):
                st.session_state["edit_record_id"] = record_id
                st.session_state["edit_data"] = row.to_dict()
                st.session_state["show_edit_form"] = True
                st.rerun()

            if st.button(f"削除 ({row['種目']})", key=f"delete_btn_{record_id}"):
                if st.confirm(f"「{row['種目']}」を削除してもよいですか？"):
                    delete_record(client, SPREADSHEET_NAME, record_id)
                    st.success("✅ 記録を削除しました！")
                    st.rerun()
else:
    st.info("この日には記録がありません。")

# --- 編集フォーム（モーダル風） ---
if "show_edit_form" not in st.session_state:
    st.session_state["show_edit_form"] = False

if st.session_state["show_edit_form"]:
    record_id = st.session_state["edit_record_id"]
    data = st.session_state["edit_data"]
    
    with st.expander(f"**記録の編集 ({data['種目']})**", expanded=True):
        with st.form("edit_record_form"):
            current_date = pd.to_datetime(data['日付']).date() 
            
            edit_date = st.date_input("日付", current_date, key="edit_date")
            edit_exercise = st.text_input("種目", data["種目"], key="edit_exercise")
            edit_weight = st.number_input("重量 (kg)", value=float(data["重量(kg)"]), min_value=0.0, step=1.0, key="edit_weight")
            edit_reps = st.number_input("回数", value=int(data["回数"]), min_value=1, step=1, key="edit_reps")
            edit_sets = st.number_input("セット数", value=int(data["セット数"]), min_value=1, step=1, key="edit_sets")
            edit_memo = st.text_area("メモ（任意）", value=data["メモ"], key="edit_memo")
            
            col_edit, col_cancel = st.columns(2)
            
            with col_edit:
                edited = st.form_submit_button("✅ 変更を保存")
            with col_cancel:
                canceled = st.form_submit_button("❌ キャンセル")

            if edited:
                 # 【修正】clientとSPREADSHEET_NAMEを渡す
                update_record(
                    client, SPREADSHEET_NAME,
                    record_id, edit_date.isoformat(), edit_exercise, 
                    edit_weight, edit_reps, edit_sets, edit_memo
                )
                st.session_state["show_edit_form"] = False
                st.success("記録を更新しました！")
                st.rerun()
                
            if canceled:
                st.session_state["show_edit_form"] = False
                st.rerun()

# ... (グラフ表示以降のコードは、既存のロジックがdfを前提としているため、そのまま継続)
