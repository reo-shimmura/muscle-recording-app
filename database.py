# database.py
import sqlite3
import pathlib

BASE_DIR = pathlib.Path(__file__).parent
DB_PATH = BASE_DIR / "data" / "muscle.db" 

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT,
                exercise TEXT,
                weight REAL,
                reps INTEGER,
                sets INTEGER,
                memo TEXT
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS body_images (
                date TEXT,
                file_path TEXT
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                exercise TEXT NOT NULL,         -- 種目名 (例: ベンチプレス)
                period_type TEXT NOT NULL,      -- 期間の種類 (weekly, monthly)
                target_type TEXT NOT NULL,      -- 目標の種類 (sets, volume, etc.)
                target_value REAL NOT NULL,     -- 目標値
                start_date TEXT NOT NULL        -- 目標の開始日
            )
        ''')
        conn.commit()

def insert_record(date, exercise, weight, reps, sets, memo):
    with sqlite3.connect(DB_PATH) as conn: # withが終了すると自動でconn.close()される
        c = conn.cursor()
        c.execute("INSERT INTO records (date, exercise, weight, reps, sets, memo) VALUES (?, ?, ?, ?, ?, ?)", 
                   (date, exercise, weight, reps, sets, memo))
        conn.commit()

def insert_image(date, file_path):
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("INSERT INTO body_images VALUES (?, ?)", (date, file_path))
        conn.commit()

def insert_goal(exercise, period_type, target_type, target_value, start_date):
    """新しい目標をデータベースに挿入する"""
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("INSERT INTO goals (exercise, period_type, target_type, target_value, start_date) VALUES (?, ?, ?, ?, ?)", 
                  (exercise, period_type, target_type, target_value, start_date))
        conn.commit()

def fetch_all_records():
    data = []
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("SELECT id, date, exercise, weight, reps, sets, memo FROM records ORDER BY date DESC")
        data = c.fetchall()
    return data

def update_record(record_id, date, exercise, weight, reps, sets, memo):
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("""
            UPDATE records 
            SET date = ?, exercise = ?, weight = ?, reps = ?, memo = ?
            WHERE id = ?
        """, (date, exercise, weight, reps, sets, memo, record_id))
        conn.commit()

def delete_record(record_id):
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("DELETE FROM records WHERE id = ?", (record_id,))
        conn.commit()

def fetch_images_by_date(date):
    data = []
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("SELECT file_path FROM body_images WHERE date = ?", (date,))
        # 取得したファイルパスからファイル名を取り出してタプルに変換する
        
        # 変更点：ファイルパスだけでなく、ファイル名も返すようにする
        results = c.fetchall()
        for row in results:
            file_path = row[0]
            # pathlibを使ってファイル名部分だけを取り出す
            file_name = pathlib.Path(file_path).name 
            data.append((file_name, file_path))
            
    return data # 例: [('2023-10-01_front.jpg', 'images/2023-10-01_front.jpg'), ...]

def fetch_all_dates_with_images():
    data = []
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("SELECT DISTINCT date FROM body_images")
        data = [row[0] for row in c.fetchall()]
    return data

def fetch_all_goals():
    """設定されている全ての目標を取得する"""
    data = []
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("SELECT id, exercise, period_type, target_type, target_value, start_date FROM goals")
        data = c.fetchall()
    return data

def delete_goal(goal_id):
    """指定されたIDの目標を削除する"""
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("DELETE FROM goals WHERE id = ?", (goal_id,))
        conn.commit()