# Supabase セットアップガイド

このアプリケーションは Supabase をバックエンドとして使用しています。以下の手順で設定してください。

## 1. Supabase プロジェクトの作成

1. [supabase.com](https://supabase.com) にアクセス
2. 「Start your project」をクリック
3. GitHub または Email でサインアップ
4. 新しいプロジェクトを作成
5. Organization と Project Name を入力
6. Database Password を設定（後で必要）
7. Region を選択（亜州の場合は `Osaka` など）

## 2. API キーとプロジェクト URL の取得

1. Supabase ダッシュボードで該当プロジェクトを開く
2. **Settings** → **API** をクリック
3. 以下の情報をコピー：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** キー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. 環境変数の設定

### ステップ 1: テンプレートをコピー
```bash
cp .env.local.example .env.local
```

### ステップ 2: `.env.local` ファイルを編集
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

※ `xxx` はプロジェクト ID に置き換えてください

## 4. records テーブルの作成

### SQL エディタからの作成（推奨）

1. Supabase ダッシュボード → **SQL Editor**
2. 「+ New query」をクリック
3. 以下の SQL を貼り付け：

```sql
CREATE TABLE records (
  id BIGSERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  exercise TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  reps BIGINT NOT NULL,
  sets BIGINT NOT NULL,
  memo TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- インデックスを作成（検索を高速化）
CREATE INDEX idx_records_date ON records(date DESC);
CREATE INDEX idx_records_exercise ON records(exercise);

-- 行レベルセキュリティ (RLS) を有効化
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- すべてのユーザーが読み書きできるポリシー（開発用）
CREATE POLICY "Allow public access" ON records
  FOR ALL USING (true) WITH CHECK (true);
```

4. **「Run」ボタンをクリック**

### テーブル作成確認

1. **Table Editor** で `records` テーブルが表示されているか確認
2. カラムが以下の通りになっているか確認：
   - `id` (BIGINT, Primary Key)
   - `date` (TEXT)
   - `exercise` (TEXT)
   - `weight` (NUMERIC)
   - `reps` (BIGINT)
   - `sets` (BIGINT)
   - `memo` (TEXT)
   - `created_at` (TIMESTAMP)

## 5. アプリケーションの起動

```bash
cd training-app
npm run dev
```

ブラウザで `http://localhost:3000` を開き、アプリが動作することを確認してください。

## トラブルシューティング

### エラー: "認証エラー"
- `.env.local` に正しい API キーが設定されているか確認
- Supabase キーが有効期限切れになっていないか確認

### エラー: "テーブル「records」が見つかりません"
- Supabase ダッシュボードの **Table Editor** で `records` テーブルが存在するか確認
- ダッシュボードで SQL を実行したか確認

### エラー: "ネットワークエラー"
- インターネット接続を確認
- Supabase のステータスページを確認：https://status.supabase.com

### データが保存できない
- Supabase ダッシュボール → **Table Editor** → `records` を開く
- **RLS (Row Level Security)** が有効になっているか確認
- RLS ポリシーが正しく設定されているか確認

## セキュリティに関する注意

⚠️ **本番環境での使用では、RLS ポリシーをより制限的に設定してください**

現在の設定は開発環境用です。本番環境では：
- ユーザー認証を追加
- RLS ポリシーを適切に設定
- Anon キーの代わりに User キーを使用

## 参考リンク

- [Supabase ドキュメント](https://supabase.com/docs)
- [Supabase JavaScript SDK](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security (RLS) ガイド](https://supabase.com/docs/guides/auth/row-level-security)
