# app.py - Google Sheets + Google Drive 連携版
import streamlit as st
import pandas as pd
import datetime as dt
import plotly.express as px
from PIL import Image
import gspread
from google.oauth2 import service_account

from database import (
    insert_record, fetch_all_records_df, update_record, delete_record,
    insert_goal, fetch_all_goals, delete_goal,
    fetch_images_by_date, fetch_all_dates_with_images
)
from drive_utils import upload_image_to_drive

# --------------------------------------------------
# 基本設定
# --------------------------------------------------
st.set_page_config(page_title="筋トレ記録 & 成長ダッシュボード", layout="wide")
st.title("💪 筋トレ・自己投資ログ & 成長ダッシュボード")

# Google Sheets クライアント設定
@st.cache_resource(show_spinner=False)
def get_gspread_client():
    creds_info = st.secrets["gcp_service_account"]
    creds = service_account.Credentials.from_service_account_info(
        creds_info, scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )
    return gspread.authorize(creds)

client = get_gspread_client()
SPREADSHEET_NAME = st.secrets["google_sheets"]["spreadsheet_name"]

# --------------------------------------------------
# タブ構成
# --------------------------------------------------
tabs = st.tabs([
    "🏋️ トレーニング記録", 
    "🎯 目標管理", 
    "📅 カレンダー", 
    "📊 統計・分析", 
    "📸 体画像アップロード", 
    "🔍 体画像比較"
])

# --------------------------------------------------
# 🏋️ トレーニング記録
# --------------------------------------------------
with tabs[0]:
    st.subheader("🏋️‍♂️ トレーニング記録の追加")

    with st.form("record_form"):
        col1, col2, col3 = st.columns(3)
        with col1:
            date = st.date_input("日付", dt.date.today())
        with col2:
            exercise = st.text_input("種目（例：ベンチプレス）")
        with col3:
            weight = st.number_input("重量 (kg)", 0.0, 500.0, 0.0)
        reps = st.number_input("回数", 0, 100, 0)
        sets = st.number_input("セット数", 0, 20, 0)
        memo = st.text_area("メモ")
        submitted = st.form_submit_button("💾 追加")
        if submitted:
            insert_record(client, SPREADSHEET_NAME, str(date), exercise, weight, reps, sets, memo)
            st.success("記録を追加しました！")

    st.markdown("---")
    st.subheader("📘 記録一覧")

    df = fetch_all_records_df(client, SPREADSHEET_NAME)
    if not df.empty:
        st.dataframe(df.sort_values("日付", ascending=False))
    else:
        st.info("まだ記録がありません。")

# --------------------------------------------------
# 🎯 目標管理
# --------------------------------------------------
with tabs[1]:
    st.subheader("🎯 目標管理")

    with st.expander("🆕 新しい目標を追加"):
        exercise = st.text_input("対象種目")
        period_type = st.selectbox("期間タイプ", ["週次", "月次", "年次"])
        target_type = st.selectbox("目標タイプ", ["重量", "回数", "合計時間"])
        target_value = st.number_input("目標値", 0.0, 10000.0, 0.0)
        start_date = st.date_input("開始日", dt.date.today())
        if st.button("💾 目標を追加"):
            insert_goal(client, SPREADSHEET_NAME, exercise, period_type, target_type, target_value, str(start_date))
            st.success("目標を追加しました！")

    st.markdown("---")
    st.subheader("🎯 登録済み目標")
    goals = fetch_all_goals(client, SPREADSHEET_NAME)
    if goals:
        goals_df = pd.DataFrame(goals, columns=["ID", "種目", "期間", "目標タイプ", "値", "開始日"])
        st.dataframe(goals_df)
    else:
        st.info("まだ目標が登録されていません。")

# --------------------------------------------------
# 📅 カレンダー
# --------------------------------------------------
with tabs[2]:
    st.subheader("📅 トレーニングカレンダー")
    df = fetch_all_records_df(client, SPREADSHEET_NAME)
    if not df.empty:
        selected_date = st.date_input("確認する日付を選択", dt.date.today())
        today_records = df[df["日付"] == str(selected_date)]
        if not today_records.empty:
            st.dataframe(today_records)
        else:
            st.info("この日に記録はありません。")
    else:
        st.info("記録データがまだありません。")

# --------------------------------------------------
# 📊 統計・分析
# --------------------------------------------------
with tabs[3]:
    st.subheader("📊 トレーニング統計")

    df = fetch_all_records_df(client, SPREADSHEET_NAME)
    if not df.empty:
        df["日付"] = pd.to_datetime(df["日付"])
        daily_sum = df.groupby("日付")["重量(kg)"].sum().reset_index()
        st.plotly_chart(px.line(daily_sum, x="日付", y="重量(kg)", title="日別トレーニング重量推移"))
    else:
        st.info("統計を表示できるデータがありません。")

# --------------------------------------------------
# 📸 体画像アップロード
# --------------------------------------------------
with tabs[4]:
    st.subheader("📸 体画像アップロード")

    upload_date = st.date_input("📅 記録日", dt.date.today())
    uploaded_file = st.file_uploader("体画像をアップロード（jpg/png）", type=["jpg", "jpeg", "png"])

    if uploaded_file:
        st.image(uploaded_file, caption="アップロードプレビュー", use_container_width=True)
        if st.button("💾 Google Driveに保存"):
            url = upload_image_to_drive(uploaded_file, f"body_{upload_date}.jpg")
            if url:
                # Google Sheets に URL 記録
                image_ws = client.open(SPREADSHEET_NAME).worksheet("image_paths")
                next_id = len(image_ws.col_values(1))
                image_ws.append_row([next_id, str(upload_date), url])
                st.success("画像をDriveに保存し、URLを記録しました！")

    st.markdown("---")
    st.subheader("📚 保存済み画像一覧")

    image_ws = client.open(SPREADSHEET_NAME).worksheet("image_paths")
    data = image_ws.get_all_values()
    if len(data) > 1:
        df_img = pd.DataFrame(data[1:], columns=["ID", "日付", "URL"])
        for _, row in df_img.iterrows():
            st.image(row["URL"], caption=row["日付"], use_container_width=True)
    else:
        st.info("まだ画像が登録されていません。")

# --------------------------------------------------
# 🔍 体画像比較
# --------------------------------------------------
with tabs[5]:
    st.subheader("🔍 体画像比較")

    image_ws = client.open(SPREADSHEET_NAME).worksheet("image_paths")
    data = image_ws.get_all_values()
    if len(data) > 1:
        df_img = pd.DataFrame(data[1:], columns=["ID", "日付", "URL"])
        dates = df_img["日付"].unique().tolist()

        col1, col2 = st.columns(2)
        with col1:
            date1 = st.selectbox("比較する日付①", dates, key="cmp1")
        with col2:
            date2 = st.selectbox("比較する日付②", dates, key="cmp2")

        if st.button("比較する"):
            url1 = df_img[df_img["日付"] == date1]["URL"].iloc[0]
            url2 = df_img[df_img["日付"] == date2]["URL"].iloc[0]
            colA, colB = st.columns(2)
            with colA:
                st.image(url1, caption=date1, use_container_width=True)
            with colB:
                st.image(url2, caption=date2, use_container_width=True)
    else:
        st.info("比較できる画像がまだありません。")

