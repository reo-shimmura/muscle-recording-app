# app.py
import streamlit as st
import pandas as pd
import plotly.express as px
import datetime as dt
from datetime import date
import os
from PIL import Image
from database import (
    init_db, insert_record, fetch_all_records,
    insert_image, fetch_images_by_date, DB_PATH,
    update_record, delete_record,
    insert_goal, fetch_all_goals, delete_goal
)
from streamlit_calendar import calendar
from streamlit_image_comparison import image_comparison
import pathlib
import gspread

# プロジェクトのルートパスを取得
BASE_DIR = pathlib.Path(__file__).parent
# DB_PATH = BASE_DIR / "data" / "muscle.db" 
IMAGE_DIR = BASE_DIR / "images"

# --- Google Sheets 接続設定（database.pyから移行） ---
SPREADSHEET_NAME = "筋トレ記録アプリ DB"

# 【重要】Streamlit secretsからサービスアカウント情報を取得して接続
# @st.cache_resource でキャッシュする
@st.cache_resource(ttl=3600)
def get_gspread_client():
    """Google Sheetsクライアントを接続し、キャッシュする"""
    try:
        # st.secrets は app.py から呼び出すのが安全
        client = gspread.service_account_from_dict(st.secrets["gcp_service_account"])
        return client
    except Exception as e:
        st.error(f"Google Sheets への接続に失敗しました: {e}")
        return None
        
client = get_gspread_client()

# --- 初期設定 ---
st.set_page_config(page_title="筋トレ記録アプリ", layout="wide")
# init_db()
os.makedirs(IMAGE_DIR, exist_ok=True)
os.makedirs(BASE_DIR / "data", exist_ok=True)

st.title("筋トレ記録＋体画像管理アプリ")

# init_db の呼び出し時に client を渡す
if client is not None:
    init_db(client) # <-- 修正: client を渡す

# --- 入力フォーム ---
st.header("トレーニング記録を追加")
with st.form("record_form"):
    record_date = st.date_input("日付", date.today())
    exercise = st.text_input("種目（例：ベンチプレス）")
    weight = st.number_input("重量 (kg)", min_value=0.0, step=1.0)
    reps = st.number_input("回数", min_value=1, step=1)
    sets = st.number_input("セット数", min_value=1, step=1, value=3)
    memo = st.text_area("メモ（任意）")
    submitted = st.form_submit_button("記録する")

    if submitted:
        if exercise.strip():
            insert_record(client, record_date.isoformat(), exercise, weight, reps, sets, memo)
            st.success("✅ 記録を保存しました！")

# --- 体画像アップロード ---
st.header("体画像をアップロード")
upload_date = st.date_input("撮影日", date.today(), key="upload_date")
uploaded_file = st.file_uploader("画像ファイルを選択", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    file_path = os.path.join(IMAGE_DIR, f"{upload_date}_{uploaded_file.name}")
    with open(file_path, "wb") as f:
        f.write(uploaded_file.getbuffer())
    insert_image(upload_date.isoformat(), file_path)
    st.success("画像を保存しました！")

# --- データ取得 ---
records = fetch_all_records(client)

# 【変更】gspreadから取得したデータはすべて文字列なので、ここで数値型に変換
df = pd.DataFrame(records, columns=["ID", "日付", "種目", "重量(kg)", "回数", "セット数", "メモ"])
if len(df) > 0:
    # 数値カラムを型変換
    df["ID"] = pd.to_numeric(df["ID"], errors='coerce').astype('Int64')
    df["重量(kg)"] = pd.to_numeric(df["重量(kg)"], errors='coerce')
    df["回数"] = pd.to_numeric(df["回数"], errors='coerce').astype('Int64')
    df["セット数"] = pd.to_numeric(df["セット数"], errors='coerce').astype('Int64')

# --- カレンダー表示 ---
st.header("カレンダー")
if len(df) > 0:
    events = [
        {"title": f"{row['種目']} ({int(row['重量(kg)'])}kg×{int(row['回数'])})", "start": row["日付"]}
        for _, row in df.iterrows()
    ]
    calendar(events=events)

selected_date = st.date_input("日付を選択して詳細を表示", date.today())
day_df = df[df["日付"] == selected_date.isoformat()].set_index("ID") 
day_images = fetch_images_by_date(selected_date.isoformat())

# --- 目標設定 ---
st.header("目標設定")
goals = fetch_all_goals(client) # 目標データを取得（Pandas変換前）

with st.expander("目標を追加・管理", expanded=False):
    with st.form("goal_form"):
        
        # 記録されたユニークな種目を取得
        unique_exercises = sorted(df["種目"].unique().tolist()) if len(df) > 0 else ["ベンチプレス", "スクワット"]
        
        goal_exercise = st.selectbox("対象種目", unique_exercises, key="goal_exercise")
        
        col_type, col_value = st.columns(2)
        with col_type:
            goal_period_type = st.selectbox("期間の種類", ["weekly (毎週)", "monthly (毎月)"], key="goal_period_type")
        with col_value:
            # 現在はセット数を目標の基準とする
            goal_target_type = st.selectbox("目標の基準", ["セット数"], key="goal_target_type")
            
        goal_value = st.number_input("目標値（総セット数）", min_value=1, step=1, value=15)
        goal_start_date = st.date_input("目標開始日", date.today())
        
        goal_submitted = st.form_submit_button("✨ 目標を設定する")

        if goal_submitted:
            # データベースに保存
            period_type_db = "weekly" if "weekly" in goal_period_type else "monthly"
            target_type_db = "sets"
            
            insert_goal(
                client,
                goal_exercise, 
                period_type_db, 
                target_type_db, 
                goal_value, 
                goal_start_date.isoformat()
            )
            st.success(f"✅ 目標「{goal_exercise} ({goal_value} {goal_target_type})」を設定しました！")
            st.rerun()

    # 設定済みの目標を表示・削除
    if len(goals) > 0:
        st.subheader("現在の設定目標")
        goals_df = pd.DataFrame(goals, columns=["ID", "種目", "期間", "基準", "目標値", "開始日"]).set_index("ID")
        st.dataframe(goals_df, use_container_width=True)
        
        # 削除機能
        delete_id = st.number_input("削除する目標のID", min_value=0, step=1)
        if st.button("🗑️ 目標を削除"):
            try:
                delete_goal(client, delete_id)
                st.success(f"ID: {delete_id} の目標を削除しました。")
                st.rerun()
            except:
                st.error("指定されたIDの目標が見つかりません。")

# --- 選択日の表示 ---
if len(day_df) > 0:
    st.subheader(f"{selected_date} のトレーニング記録")

    # データフレーム表示（ID、日付、メモは非表示）
    display_df = day_df.drop(columns=["日付", "メモ"], errors='ignore')

    # 編集・削除ボタンのためのコンテナ
    cols_count = len(day_df)
    
    # データフレームの表示
    st.dataframe(display_df, use_container_width=True)

    # 各レコードに対する操作ボタン
    st.write("---")
    st.markdown("**操作**")
    cols = st.columns(cols_count) # 記録の数だけ列を作成
    
    for i, (record_id, row) in enumerate(day_df.iterrows()):
        with cols[i]:
            # 編集ボタン
            if st.button(f"編集 ({row['種目']})", key=f"edit_btn_{record_id}"):
                # 編集フォームを表示するフラグをセッションステートに設定
                st.session_state["edit_record_id"] = record_id
                st.session_state["edit_data"] = row.to_dict() # 既存データを渡す
                st.session_state["show_edit_form"] = True
                st.rerun() # フォーム表示のために再実行

            # 削除ボタン
            if st.button(f"🗑️ 削除 ({row['種目']})", key=f"delete_btn_{record_id}"):
                # 削除確認
                if st.warning(f"「{row['種目']}」の記録を本当に削除しますか？"):
                     # 削除実行
                    delete_record(client, record_id)
                    st.success("✅ 記録を削除しました！")
                    st.rerun() # 画面を更新

else:
    st.info("この日には記録がありません。")

if len(day_images) > 0:
    st.subheader("この日の体画像")
    cols = st.columns(len(day_images))
    for i, path in enumerate(day_images):
        with cols[i]:
            st.image(path, caption=f"{selected_date}")
else:
    st.info("この日にアップロードされた画像はありません。")

# --- 画像比較機能 ---
st.header("過去画像と比較")
col1, col2 = st.columns(2)
# 画像1の選択
with col1:
    compare_date1 = st.date_input("画像1の日付", date.today(), key="compare1")
    img1_list_tuples = fetch_images_by_date(compare_date1.isoformat())
    
    # 選択肢の生成: (ファイル名: ファイルパス) の辞書
    img1_options = {name: path for name, path in img1_list_tuples}
    
    # 画像の選択ドロップダウン
    selected_img1_name = st.selectbox(
        "画像1を選択", 
        options=list(img1_options.keys()),
        key="select_img1"
    )

# 画像2の選択
with col2:
    compare_date2 = st.date_input("画像2の日付", date.today(), key="compare2")
    img2_list_tuples = fetch_images_by_date(compare_date2.isoformat())
    
    # 選択肢の生成: (ファイル名: ファイルパス) の辞書
    img2_options = {name: path for name, path in img2_list_tuples}
    
    # 画像の選択ドロップダウン
    selected_img2_name = st.selectbox(
        "画像2を選択", 
        options=list(img2_options.keys()),
        key="select_img2"
    )

# 比較実行
if selected_img1_name and selected_img2_name:
    # 選択されたファイル名から実際のファイルパスを取得
    img1_path = img1_options[selected_img1_name]
    img2_path = img2_options[selected_img2_name]
    
    st.subheader(f"{compare_date1} 🆚 {compare_date2}")
    image_comparison(
        img1=img1_path,
        img2=img2_path,
        label1=str(compare_date1) + f" ({selected_img1_name})", # ファイル名も表示
        label2=str(compare_date2) + f" ({selected_img2_name})", # ファイル名も表示
        width=700,
    )
else:
    st.info("比較する画像を選択してください。")

# --- 目標期間の計算と実績集計のヘルパー関数 ---
def get_period_dates(start_date_str, period_type):
    """目標の開始日から現在の期間（今週/今月）の範囲を計算する"""
    start_date = dt.datetime.strptime(start_date_str, '%Y-%m-%d').date()
    today = date.today()
    
    # 目標開始日が今日より後の場合は、期間なし
    if start_date > today:
        return None, None
    
    if period_type == "weekly":
        # 今週の月曜日を取得（月曜日=0, 日曜日=6）
        current_period_start = today - dt.timedelta(days=today.weekday())
        current_period_end = current_period_start + dt.timedelta(days=6)
        
    elif period_type == "monthly":
        # 今月の1日を取得
        current_period_start = date(today.year, today.month, 1)
        # 来月の1日の前日を取得（今月の末日）
        if today.month == 12:
            current_period_end = date(today.year + 1, 1, 1) - dt.timedelta(days=1)
        else:
            current_period_end = date(today.year, today.month + 1, 1) - dt.timedelta(days=1)
    
    # 目標が始まった後の期間に限定
    if current_period_start < start_date:
        current_period_start = start_date

    return current_period_start, current_period_end

# --- 目標達成率の可視化 ---
st.header("📈 目標達成の進捗")

if len(goals) == 0:
    st.info("目標が設定されていません。目標を追加してください。")
else:
    # 目標をPandas DataFrameに変換
    goals_df = pd.DataFrame(goals, columns=["ID", "種目", "期間", "基準", "目標値", "開始日"])
    
    for _, goal in goals_df.iterrows():
        exercise = goal["種目"]
        period_type = goal["期間"]
        target_value = goal["目標値"]
        start_date_str = goal["開始日"]
        
        # 1. 目標期間の計算
        start_of_period, end_of_period = get_period_dates(start_date_str, period_type)

        if start_of_period is None:
             st.markdown(f"**{exercise}** ({period_type}目標: {int(target_value)}セット)")
             st.info(f"目標開始日（{start_date_str}）が未来のため、計測を開始していません。")
             continue

        # 2. 実績の集計
        # 日付フィルタリング
        df_filtered_date = df[
            (pd.to_datetime(df["日付"]).dt.date >= start_of_period) & 
            (pd.to_datetime(df["日付"]).dt.date <= end_of_period)
        ]
        
        # 種目フィルタリング
        df_filtered_goal = df_filtered_date[df_filtered_date["種目"] == exercise]
        
        # 実績セット数の合計
        achieved_value = df_filtered_goal["セット数"].sum()
        
        # 3. 達成率の計算と表示
        
        achievement_rate = achieved_value / target_value
        display_rate = min(achievement_rate, 1.0) # 100%を超えても100%で表示
        
        st.markdown(f"**{exercise}** ({period_type}目標: {int(target_value)}セット)")
        st.caption(f"計測期間: {start_of_period.isoformat()} 〜 {end_of_period.isoformat()}")

        # プログレスバーで可視化
        st.progress(display_rate, text=f"達成率: {achieved_value:.0f} / {target_value:.0f} セット ({display_rate:.1%})")

        # 100%達成時のメッセージ
        if achievement_rate >= 1.0:
            st.balloons()
            st.success("目標達成おめでとうございます！")

# --- グラフ表示 ---
st.header("📊 トレーニングボリューム推移")
if len(df) > 0:
    # データの準備
    df["ボリューム"] = df["重量(kg)"] * df["回数"] * df["セット数"]
    df["日付"] = pd.to_datetime(df["日付"])

    # 1. 種目選択UIの追加
    # 全ての種目と、「--- 全ての種目 ---」オプションを作成
    unique_exercises = ["--- 全ての種目 ---"] + sorted(df["種目"].unique().tolist())
    selected_exercise = st.selectbox(
        "分析する種目を選択してください", 
        unique_exercises,
        key="exercise_analysis_select"
    )

    # 2. データのフィルタリング
    if selected_exercise == "--- 全ての種目 ---":
        # 全ての種目の場合は、既存のコード通り「種目」ごとに色分け
        filtered_df = df
        color_column = "種目"
    else:
        # 特定の種目の場合は、その種目のみに絞り込む
        filtered_df = df[df["種目"] == selected_exercise]
        color_column = None # 単一種目のため色分けは不要

    # 3. ボリューム推移グラフの作成
    st.subheader(f"{selected_exercise} のボリューム推移")
    
    # プロットリーで線グラフを作成
    fig_volume = px.line(
        filtered_df, 
        x="日付", 
        y="ボリューム", 
        color=color_column, 
        markers=True,
        title=f"{selected_exercise}のトレーニングボリューム推移 (重量 × 回数)"
    )
    st.plotly_chart(fig_volume, use_container_width=True)
    
    # 4. 特定の種目選択時のみ、重量(Max Weight)推移グラフを追加 (オプション)
    if selected_exercise != "--- 全ての種目 ---":
        st.subheader(f"{selected_exercise} の最大重量推移")
        
        # 日付ごとの最大重量を計算して推移を見る
        weight_progression_df = filtered_df.groupby('日付')['重量(kg)'].max().reset_index()
        
        fig_weight = px.line(
            weight_progression_df, 
            x="日付", 
            y="重量(kg)", 
            markers=True,
            title="日付ごとの最大重量 (1回のセッションの最高重量)"
        )
        st.plotly_chart(fig_weight, use_container_width=True)

if "show_edit_form" not in st.session_state:
    st.session_state["show_edit_form"] = False

if st.session_state["show_edit_form"]:
    record_id = st.session_state["edit_record_id"]
    data = st.session_state["edit_data"]
    
    # モーダル的な表示
    with st.expander(f"**📝 記録の編集 ({data['種目']})**", expanded=True):
        with st.form("edit_record_form"):
            # PandasのTimestampをdateオブジェクトに変換
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
                update_record(
                    client,
                    record_id, 
                    edit_date.isoformat(), 
                    edit_exercise, 
                    edit_weight, 
                    edit_reps, 
                    edit_sets,
                    edit_memo
                )
                st.session_state["show_edit_form"] = False # フォームを閉じる
                st.success("🎉 記録を更新しました！")
                st.rerun()
                
            if canceled:
                st.session_state["show_edit_form"] = False # フォームを閉じる
                st.rerun()
