# database.py - Google Sheets バージョン
# import streamlit as st
import gspread
import pandas as pd
import pathlib # ファイルパスの操作は残しますが、DB_PATHの利用はなくなります

# 【重要】スプレッドシートのURLまたは名前
SPREADSHEET_NAME = "筋トレ記録アプリ DB" 
SHEET_RECORD = "records"
SHEET_GOAL = "goals"

# 初期化関数（今回は接続確認とヘッダー確認のみ）
def init_db(client):
    #client = get_gspread_client()
    if client is None:
        return
    try:
        # スプレッドシートを開く
        client.open(SPREADSHEET_NAME)
        # st.success("Google Sheets 接続 OK")
    except gspread.exceptions.SpreadsheetNotFound:
        st.error(f"スプレッドシート '{SPREADSHEET_NAME}' が見つかりません。名前を確認してください。")
    except Exception as e:
        st.error(f"データベースの初期化中にエラーが発生しました: {e}")

# --- ヘルパー関数 ---
def get_worksheet(client, sheet_name):
    """ワークシートを取得するヘルパー関数"""
    # client = get_gspread_client()
    if client is None:
        return None
    try:
        ss = client.open(SPREADSHEET_NAME)
        return ss.worksheet(sheet_name)
    except Exception as e:
        st.error(f"{sheet_name} シートの取得に失敗しました: {e}")
        return None

# --- CRUD 関数群 ---

def insert_record(client, date, exercise, weight, reps, sets, memo):
    ws = get_worksheet(client, SHEET_RECORD)
    if ws is None: return

    # 新しいIDを採番 (既存の行数 + 1を簡易IDとする)
    new_id = len(ws.col_values(1)) 
    
    # 追加するデータ
    data = [
        new_id,
        date,
        exercise,
        float(weight),
        int(reps),
        int(sets),
        memo
    ]
    # スプレッドシートの最終行に追加
    ws.append_row(data)

def fetch_all_records(client):
    ws = get_worksheet(client, SHEET_RECORD)
    if ws is None: return []

    # ヘッダー行を含めて全てのデータを取得
    data = ws.get_all_values()
    if not data:
        return []

    # ヘッダー行を除いて返す
    return data[1:] 


def update_record(client, record_id, date, exercise, weight, reps, sets, memo):
    ws = get_worksheet(client, SHEET_RECORD)
    if ws is None: return

    # IDでレコードを検索し、行番号を取得
    try:
        # 1列目（ID列）で該当IDを検索し、最初に見つかったセルの行番号を取得
        cell = ws.find(str(record_id), in_column=1)
        row_num = cell.row
        
        # 変更するデータ
        new_data = [
            int(record_id),
            date,
            exercise,
            float(weight),
            int(reps),
            int(sets),
            memo
        ]
        
        # 該当行を新しいデータで更新（A列からG列まで）
        ws.update(f'A{row_num}:G{row_num}', [new_data])
        
    except gspread.exceptions.CellNotFound:
        st.error(f"更新対象のID: {record_id} が見つかりませんでした。")
    except Exception as e:
        st.error(f"レコードの更新中にエラーが発生しました: {e}")


def delete_record(client, record_id):
    ws = get_worksheet(client, SHEET_RECORD)
    if ws is None: return

    try:
        cell = ws.find(str(record_id), in_column=1)
        # 該当行を削除
        ws.delete_rows(cell.row)
    except gspread.exceptions.CellNotFound:
        st.error(f"削除対象のID: {record_id} が見つかりませんでした。")
    except Exception as e:
        st.error(f"レコードの削除中にエラーが発生しました: {e}")
        
# --- 目標（Goals）関連の関数 ---

# 目標関連も同様に書き換え (省略)
def insert_goal(client, exercise, period_type, target_type, target_value, start_date):
    ws = get_worksheet(client, SHEET_GOAL)
    if ws is None: return
    
    # 新しいIDを採番 (既存の行数 + 1を簡易IDとする)
    new_id = len(ws.col_values(1)) 

    data = [
        new_id,
        exercise, 
        period_type, 
        target_type, 
        float(target_value), 
        start_date
    ]
    ws.append_row(data)

def fetch_all_goals(client):
    ws = get_worksheet(client, SHEET_GOAL)
    if ws is None: return []

    data = ws.get_all_values()
    if not data:
        return []

    # ヘッダー行を除いて返す
    return data[1:]

def delete_goal(client, goal_id):
    ws = get_worksheet(client, SHEET_GOAL)
    if ws is None: return
    
    try:
        cell = ws.find(str(goal_id), in_column=1)
        ws.delete_rows(cell.row)
    except gspread.exceptions.CellNotFound:
        st.error(f"削除対象の目標ID: {goal_id} が見つかりませんでした。")
    except Exception as e:
        st.error(f"目標の削除中にエラーが発生しました: {e}")

# --- 体画像関連の関数は、ファイルの読み書きのためそのまま残すか、別の方法を検討してください ---

# fetch_images_by_date と fetch_all_dates_with_images は、画像ファイルパスの
# 記録と取得なので、SQLiteの代わりに Google Sheets を使います
# ※ 画像ファイルの本体は Streamlit Cloud では永続化できない点に注意

def insert_image(date, file_path):
    # 画像ファイルパスを記録するためのシート（今回は records シートを使用すると仮定）
    # ※ 本来は body_images シートが必要です。構造をシンプルにするため、このまま進めます
    # （画像パス管理はファイルストレージの問題があるので、このままでは不完全です）
    pass # 一旦処理をスキップ
    # Google Sheetsで画像パスを記録しても、ファイル本体が消えるため、この機能はクラウドでは別途検討が必要です

def fetch_images_by_date(date):
    # 画像パスはクラウドで永続化できないため、一旦空リストを返します
    return []

def fetch_all_dates_with_images():
    return []