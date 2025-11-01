import streamlit as st
import pandas as pd
import plotly.express as px
from datetime import date
import datetime as dt
import os
import pathlib

# 外部モジュール（既存アプリと同様）
from database import (
    insert_record, fetch_all_records_df, update_record, delete_record,
    insert_image, fetch_images_by_date, fetch_all_dates_with_images,
    insert_goal, fetch_all_goals, delete_goal
)
from drive_utils import upload_image_to_drive
from streamlit_calendar import calendar
from streamlit_image_comparison import image_comparison

# --- ページ設定 & テーマ ---
st.set_page_config(page_title="筋トレログ", page_icon="🏋️", layout="wide")

# サイト全体のカスタムCSS（カード・余白・タイポなど）
st.markdown("""
<style>
/* コンテナ幅を制限して中央寄せ */
div.block-container { max-width: 1200px; margin: auto; padding-top: 1.2rem; padding-bottom: 2rem; }
/* 見出し整形 */
h1, h2, h3, h4 { color: #222; font-weight: 600; }
/* カード風コンテナ */
.card { background-color: #ffffff; padding: 1rem 1rem; border-radius: 12px; box-shadow: 0 6px 18px rgba(0,0,0,0.06); }
.small-muted { color: #666; font-size: 0.9rem; }
/* フォームの要素間隔 */
.element-container { margin-bottom: 0.8rem; }
</style>
""", unsafe_allow_html=True)

# --- 定数 & ディレクトリ ---
BASE_DIR = pathlib.Path(__file__).parent
IMAGE_DIR = BASE_DIR / "images"
os.makedirs(IMAGE_DIR, exist_ok=True)
SPREADSHEET_NAME = "筋トレ記録アプリ DB"


# --- GSpread クライアント取得（キャッシュ） ---
@st.cache_resource(show_spinner=False)
def get_gspread_client():
    import gspread
    sa = st.secrets.get("gcp_service_account")
    if not sa:
        return None
    client = gspread.service_account_from_dict(sa)
    return client

client = get_gspread_client()

# 接続確認
if client is None:
    st.sidebar.error("Google Drive / Sheets クライアントの認証情報が見つかりません。st.secrets で設定してください。")
    st.stop()


# --- ユーティリティ関数 ---

def safe_to_numeric(df, col, dtype='Int64'):
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce').astype(dtype)
    return df

def reload_data(client, SPREADSHEET_NAME):
    """スプレッドシートから最新データを取得して前処理して返す"""
    df = fetch_all_records_df(client, SPREADSHEET_NAME) if client else pd.DataFrame()
    goals = fetch_all_goals(client, SPREADSHEET_NAME) if client else []
    if len(df) > 0:
        df["ID"] = pd.to_numeric(df.get("ID"), errors='coerce').astype('Int64')
        df["重量(kg)"] = pd.to_numeric(df.get("重量(kg)"), errors='coerce')
        df["回数"] = pd.to_numeric(df.get("回数"), errors='coerce').astype('Int64')
        df["セット数"] = pd.to_numeric(df.get("セット数"), errors='coerce').astype('Int64')
    return df, goals


# 初回ロード
df, goals = reload_data(client, SPREADSHEET_NAME)

# --- レイアウト: タイトル + サブ説明 ---
st.title("筋トレ記録・管理アプリ")
st.caption(f"最終更新: {date.today().isoformat()}")

# サイドバー - 簡易ナビゲーション
with st.sidebar:
    st.header("メニュー")
    st.markdown("- 📝 記録追加\n- 🎯 目標管理\n- 📅 カレンダー\n- 📊 統計・詳細")
    st.write("---")
    st.markdown("**操作ヒント**")
    st.markdown("・画像はDriveにアップロードされます。\n・目標は週/月単位で設定できます。")

# --- タブ構成 ---
tab_write, tab_goals, tab_calendar, tab_details = st.tabs([
    "📝 記録追加", "🎯 目標管理", "📅 カレンダー", "📊 統計・記録詳細"
])

# -------------------------
# タブ: 記録追加
# -------------------------
with tab_write:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.subheader("📝 トレーニング記録を追加")

    with st.form("record_form"):
        cols = st.columns([1, 2])
        with cols[0]:
            record_date = st.date_input("日付", date.today())
            weight = st.number_input("重量 (kg)", min_value=0.0, step=1.0)
            reps = st.number_input("回数", min_value=1, step=1)
        with cols[1]:
            # 種目候補
            unique_exercises = sorted(df["種目"].dropna().unique().tolist()) if len(df) > 0 else []
            exercise_choice = st.selectbox(
                "種目を選択 (または新規入力)",
                options=["--- 新規入力 ---"] + unique_exercises,
                key="record_select_exercise_key"
            )
            if exercise_choice == "--- 新規入力 ---":
                exercise = st.text_input("種目名を入力（例：ベンチプレス）", key="record_new_exercise_key")
            else:
                exercise = exercise_choice

            sets = st.number_input("セット数", min_value=1, step=1, value=3)

        memo = st.text_area("メモ（任意）")
        uploaded_file = st.file_uploader("体画像をアップロード（任意）", type=["jpg", "jpeg", "png"]) 

        submitted = st.form_submit_button("記録する ✨")

        if submitted:
            if not (exercise and str(exercise).strip()):
                st.error("種目名を入力してください。")
            else:
                image_url = ""
                if uploaded_file:
                    filename = f"{record_date}_{exercise}.jpg"
                    with st.spinner("画像をアップロード中..."):
                        try:
                            image_url = upload_image_to_drive(uploaded_file, filename)
                        except Exception as e:
                            st.error(f"画像アップロードに失敗しました: {e}")
                            image_url = ""

                try:
                    insert_record(
                        client, SPREADSHEET_NAME,
                        record_date.isoformat(), exercise, weight, reps, sets,
                        memo + (f"\n📷: {image_url}" if image_url else "")
                    )
                    st.success("✅ 記録を保存しました！")
                    # データ再読み込み
                    df, goals = reload_data()
                    st.experimental_rerun()
                except Exception as e:
                    st.error(f"記録の保存に失敗しました: {e}")

    st.markdown('</div>', unsafe_allow_html=True)

# -------------------------
# タブ: 目標管理
# -------------------------
with tab_goals:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.subheader("🎯 目標を追加・管理")

    with st.expander("目標を追加する", expanded=True):
        with st.form("goal_form"):
            unique_goal_exercises = sorted(df["種目"].dropna().unique().tolist()) if len(df) > 0 else ["ベンチプレス", "スクワット"]
            goal_exercise = st.selectbox("対象種目", unique_goal_exercises)
            col_type, col_value = st.columns(2)
            with col_type:
                goal_period_type = st.selectbox("期間の種類", ["weekly (毎週)", "monthly (毎月)"])
            with col_value:
                goal_target_type = st.selectbox("目標の基準", ["セット数"], disabled=True)

            goal_value = st.number_input("目標値（総セット数）", min_value=1, step=1, value=15)
            goal_start_date = st.date_input("目標開始日", date.today())

            goal_submitted = st.form_submit_button("目標を設定する 🎯")

            if goal_submitted:
                period_type_db = "weekly" if "weekly" in goal_period_type else "monthly"
                target_type_db = "sets"
                try:
                    insert_goal(client, SPREADSHEET_NAME, goal_exercise, period_type_db, target_type_db, goal_value, goal_start_date.isoformat())
                    st.success(f"✅ 目標「{goal_exercise} ({goal_value} {target_type_db})」を設定しました！")
                    df, goals = reload_data()
                    st.experimental_rerun()
                except Exception as e:
                    st.error(f"目標の保存に失敗しました: {e}")

    # 設定済みの目標表示
    if len(goals) > 0:
        st.subheader("現在の設定目標")
        goals_df = pd.DataFrame(goals, columns=["ID", "種目", "期間", "基準", "目標値", "開始日"]) 
        goals_df["ID"] = pd.to_numeric(goals_df["ID"], errors='coerce').astype('Int64')
        st.dataframe(goals_df.set_index("ID"), use_container_width=True)

        with st.expander("目標を削除する", expanded=False):
            delete_goal_id = st.number_input("削除する目標のID", min_value=0, step=1)
            if st.button("目標を削除する"):
                if delete_goal_id in goals_df["ID"].values:
                    try:
                        delete_goal(client, SPREADSHEET_NAME, int(delete_goal_id))
                        st.success(f"ID: {delete_goal_id} の目標を削除しました。")
                        df, goals = reload_data()
                        st.experimental_rerun()
                    except Exception as e:
                        st.error(f"削除に失敗しました: {e}")
                else:
                    st.error("指定されたIDの目標が見つかりません。")

    st.markdown('</div>', unsafe_allow_html=True)

# -------------------------
# タブ: カレンダー
# -------------------------
with tab_calendar:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.subheader("📅 トレーニングカレンダー")

    # Calendar コンポーネントの呼び出し（streamlit_calendar の仕様に合わせて利用）
    try:
        marked_dates = []
        if len(df) > 0:
            marked_dates = df["日付"].dropna().unique().tolist()
        calendar(marked_dates=marked_dates)
    except Exception:
        st.info("カレンダーの表示は環境によっては動作しないことがあります。")

    st.markdown("---")
    st.subheader("画像比較")
    left_img = st.file_uploader("比較: 左画像を選択", type=["jpg", "png", "jpeg"], key="comp_left")
    right_img = st.file_uploader("比較: 右画像を選択", type=["jpg", "png", "jpeg"], key="comp_right")
    if left_img and right_img:
        try:
            image_comparison(left_image=left_img, right_image=right_img,  label_left="Before", label_right="After")
        except Exception:
            st.image([left_img, right_img], caption=["Before", "After"], width=300)

    st.markdown('</div>', unsafe_allow_html=True)

# -------------------------
# タブ: 統計・記録詳細
# -------------------------
with tab_details:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.subheader("📊 記録の参照・編集・削除")

    # 日付でフィルタ
    selected_date = st.date_input("日付を選択して詳細を表示", date.today())
    day_df = df[df["日付"] == selected_date.isoformat()].copy()

    if len(day_df) > 0:
        display_df = day_df.drop(columns=["メモ"], errors='ignore').set_index("ID")
        st.dataframe(display_df, use_container_width=True)

        # 画像表示（メモ内のDriveリンクを探す）
        st.markdown("---")
        img_urls = []
        for _, row in day_df.iterrows():
            memo_text = str(row.get("メモ", ""))
            if "https://drive.google.com" in memo_text:
                idx = memo_text.find("https://drive.google.com")
                img_urls.append(memo_text[idx:])

        if img_urls:
            st.subheader("当日の画像")
            cols = st.columns(min(len(img_urls), 3))
            for i, url in enumerate(img_urls):
                with cols[i % 3]:
                    st.image(url, caption=f"画像 {i+1}", use_container_width=True)

        st.markdown("---")
        st.write("**操作**")

        # 編集・削除ボタン列
        cols_ops = st.columns(len(day_df))
        for i, (record_id, row) in enumerate(day_df.set_index("ID").iterrows()):
            with cols_ops[i]:
                if st.button(f"編集 ({row['種目']})", key=f"edit_btn_{record_id}"):
                    st.session_state['editing'] = int(record_id)
                    st.session_state['edit_row'] = row.to_dict()
                if st.button(f"削除 ({row['種目']})", key=f"del_btn_{record_id}"):
                    st.session_state['pending_delete'] = int(record_id)

        # 編集フォーム（セッション状態に基づく）
        if st.session_state.get('editing'):
            edit_id = st.session_state.get('editing')
            edit_row = st.session_state.get('edit_row')
            st.markdown('---')
            st.subheader(f"記録を編集 — ID: {edit_id}")
            with st.form("edit_form"):
                edit_date = st.date_input("日付", pd.to_datetime(edit_row['日付']).date())
                edit_exercise = st.text_input("種目", edit_row['種目'])
                edit_weight = st.number_input("重量 (kg)", value=float(edit_row.get('重量(kg)', 0.0)))
                edit_reps = st.number_input("回数", value=int(edit_row.get('回数', 1)))
                edit_sets = st.number_input("セット数", value=int(edit_row.get('セット数', 1)))
                edit_memo = st.text_area("メモ", value=edit_row.get('メモ', ''))

                submitted_edit = st.form_submit_button("保存する")
                cancelled_edit = st.form_submit_button("キャンセル")

                if submitted_edit:
                    try:
                        update_record(client, SPREADSHEET_NAME, edit_id, edit_date.isoformat(), edit_exercise, edit_weight, edit_reps, edit_sets, edit_memo)
                        st.success("編集を保存しました。")
                        # 状態をクリア
                        st.session_state.pop('editing', None)
                        st.session_state.pop('edit_row', None)
                        df, goals = reload_data()
                        st.experimental_rerun()
                    except Exception as e:
                        st.error(f"更新に失敗しました: {e}")
                if cancelled_edit:
                    st.session_state.pop('editing', None)
                    st.session_state.pop('edit_row', None)
                    st.experimental_rerun()

        # 削除確認
        if st.session_state.get('pending_delete'):
            pid = st.session_state['pending_delete']
            st.warning(f"ID: {pid} を本当に削除しますか？ この操作は取り消せません。")
            col_confirm, col_cancel = st.columns(2)
            with col_confirm:
                if st.button("はい、削除します", key=f"confirm_del_{pid}"):
                    try:
                        delete_record(client, SPREADSHEET_NAME, pid)
                        st.success("削除しました。")
                        st.session_state.pop('pending_delete', None)
                        df, goals = reload_data()
                        st.experimental_rerun()
                    except Exception as e:
                        st.error(f"削除に失敗しました: {e}")
                        st.session_state.pop('pending_delete', None)
            with col_cancel:
                if st.button("キャンセル", key=f"cancel_del_{pid}"):
                    st.session_state.pop('pending_delete', None)
                    st.experimental_rerun()

    else:
        st.info("この日には記録がありません。")

    st.markdown('</div>', unsafe_allow_html=True)

# --- フッター ---
st.markdown("---")
st.caption("アプリ改良版 — UI: タブ構成・カードデザイン・編集フロー改善")

