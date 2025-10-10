# database.py - Google Sheets (gspread) Logic

import gspread
import pandas as pd
import os

# --- 設定 ---
SHEET_RECORD = "records"
SHEET_GOAL = "goals"
SHEET_IMAGE_PATH = "image_paths" # 画像パスを記録する新しいシートを定義

# --- ヘルパー関数 ---

def get_worksheet(client, spreadsheet_name, sheet_name):
    """ワークシートを取得するヘルパー関数"""
    if client is None:
        return None
    try:
        ss = client.open(spreadsheet_name)
        return ss.worksheet(sheet_name)
    except gspread.exceptions.WorksheetNotFound:
        # シートが見つからない場合はNoneを返し、app.pyでエラー表示
        return None
    except Exception:
        return None

# --- レコード CRUD ---

def insert_record(client, spreadsheet_name, date, exercise, weight, reps, sets, memo):
    ws = get_worksheet(client, spreadsheet_name, SHEET_RECORD)
    if ws is None: return

    ids = ws.col_values(1)[1:]  # ヘッダー除外
    new_id = max(map(int, ids), default=0) + 1
    ws.append_row([new_id, date, exercise, float(weight), int(reps), int(sets), memo])

def fetch_all_records_df(client, spreadsheet_name):
    data = fetch_all_records(client, spreadsheet_name)
    if not data:
        return pd.DataFrame(columns=["ID", "日付", "種目", "重量(kg)", "回数", "セット数", "メモ"])
    df = pd.DataFrame(data, columns=["ID", "日付", "種目", "重量(kg)", "回数", "セット数", "メモ"])
    df = df.apply(pd.to_numeric, errors="ignore")
    return df

def update_record(client, spreadsheet_name, record_id, date, exercise, weight, reps, sets, memo):
    ws = get_worksheet(client, spreadsheet_name, SHEET_RECORD)
    if ws is None: return

    try:
        cell = ws.find(str(record_id), in_column=1)
        row_num = cell.row
        
        new_data = [int(record_id), date, exercise, float(weight), int(reps), int(sets), memo]
        # A列からG列までを更新
        ws.update(f'A{row_num}:G{row_num}', [new_data])
        
    except gspread.exceptions.CellNotFound:
        # app.py側でエラー表示するため、ここではpass
        pass

def delete_record(client, spreadsheet_name, record_id):
    ws = get_worksheet(client, spreadsheet_name, SHEET_RECORD)
    if ws is None: return

    try:
        cell = ws.find(str(record_id), in_column=1)
        ws.delete_rows(cell.row)
    except gspread.exceptions.CellNotFound:
        pass


# --- 目標 (Goals) CRUD ---

def insert_goal(client, spreadsheet_name, exercise, period_type, target_type, target_value, start_date):
    ws = get_worksheet(client, spreadsheet_name, SHEET_GOAL)
    if ws is None: return
    
    new_id = len(ws.col_values(1)) 
    data = [new_id, exercise, period_type, target_type, float(target_value), start_date]
    ws.append_row(data)

def fetch_all_goals(client, spreadsheet_name):
    ws = get_worksheet(client, spreadsheet_name, SHEET_GOAL)
    if ws is None: return []

    data = ws.get_all_values()
    # ヘッダー行を除いて返す
    return data[1:] if data and len(data) > 1 else []

def delete_goal(client, spreadsheet_name, goal_id):
    ws = get_worksheet(client, spreadsheet_name, SHEET_GOAL)
    if ws is None: return
    
    try:
        cell = ws.find(str(goal_id), in_column=1)
        ws.delete_rows(cell.row)
    except gspread.exceptions.CellNotFound:
        pass

# --- 画像パス (Image Paths) CRUD (簡易版) ---
# ※ 画像ファイル本体は永続化されないため、この機能は動作しませんが、エラー回避のために残します。

def insert_image(client, spreadsheet_name, date, file_path):
    # 本来は専用シートに記録すべきだが、実装省略
    pass

def fetch_images_by_date(client, spreadsheet_name, date):
    return []

def fetch_all_dates_with_images(client, spreadsheet_name):
    return []