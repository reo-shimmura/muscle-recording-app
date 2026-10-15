# 筋トレ記録・管理アプリ

筋力トレーニングの記録・目標管理・進捗確認ができる PWA 対応の Web アプリです。
[Next.js](https://nextjs.org) (App Router) + TypeScript で構築されています。

## 主な機能

アプリ下部のタブから、以下の 5 つの画面を利用できます。

| タブ | 画面 | 内容 |
| --- | --- | --- |
| 🏠 | ホーム | 目標の進捗（長期目標の達成率、週間・月間の実施状況）をひと目で確認できるダッシュボード |
| 📝 | 記録追加 | 種目・重量・回数・セット数（有酸素種目は実施時間）を入力してトレーニング記録を保存。セットのテンプレート化や一括入力にも対応 |
| 🎯 | 目標管理 | 種目ごとの長期目標（例: ベンチプレス最大重量 60kg）、週間・月間の実施回数目標を登録・編集 |
| 📅 | カレンダー | 月単位のカレンダーに、日ごとの記録を種目別にグルーピングして表示 |
| 📊 | 統計・詳細 | 記録の一覧・絞り込み・編集・削除、種目別の推移グラフ（[Recharts](https://recharts.org/)）による可視化 |

その他の特徴:

- パスワードによるログイン認証（未ログイン時は画面・API ともにアクセス不可）
- ホーム画面に追加できる PWA（`manifest.json` / アイコン同梱）
- 種目はデフォルト種目に加えて、カテゴリ付きのカスタム種目を登録可能
- データベースは [libSQL (Turso)](https://turso.tech/) クライアントを使用。接続先を指定しない場合はローカルの SQLite ファイルに自動フォールバックするため、追加設定なしでも動作確認が可能

## 技術スタック

- [Next.js 16](https://nextjs.org/)（App Router, Route Handlers）
- [React 19](https://react.dev/) / TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)（`components/ui` 配下）
- [Recharts](https://recharts.org/)（統計グラフ）
- [@libsql/client](https://github.com/tursodatabase/libsql-client-ts)（Turso / SQLite 互換データベースクライアント）
- パッケージ管理: [pnpm](https://pnpm.io/)

## ディレクトリ構成

アプリ本体は `training-app` ディレクトリにあります。

```
muscle-recording-app/
└── training-app/        # Next.js アプリ本体
    ├── app/
    │   ├── api/          # 記録・種目・目標の API Route Handlers
    │   ├── components/   # 画面・タブごとのコンポーネント
    │   ├── hooks/        # データ取得・更新用のカスタムフック
    │   ├── lib/           # 画面向けの集計・加工ロジック
    │   ├── login/         # ログイン画面
    │   └── page.tsx       # タブ切り替えを行うエントリーポイント
    ├── components/ui/    # shadcn/ui の共通 UI パーツ
    ├── proxy.ts           # 未認証リクエストのブロック
    └── lib/
        ├── auth.ts        # パスワード検証・セッション Cookie の署名
        ├── db.ts          # libSQL クライアントの初期化・スキーマ定義
        └── repository/    # テーブルごとのデータアクセス層
```

## セットアップ・起動方法

### 1. 依存パッケージのインストール

```bash
cd training-app
pnpm install
```

### 2. 環境変数の設定

`training-app` 直下に `.env.local` を作成し、以下を設定してください。

```bash
# 【必須】ログインパスワード（推測されにくい長いものを推奨）
APP_PASSWORD=your-strong-password
# 【必須】セッション署名用の秘密鍵（32文字以上のランダム文字列）
# 例: node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
AUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 【任意】Turso ダッシュボード（https://turso.tech/）で発行した値
TURSO_DATABASE_URL=libsql://xxx.turso.io
TURSO_AUTH_TOKEN=xxxxxxxx
```

- `APP_PASSWORD` / `AUTH_SECRET` が未設定の場合はログインできず、すべての画面・API がブロックされます。
- `TURSO_*` を設定しない場合は `training-app/training.db`（SQLite ファイル）が自動的に使われるため、ローカルでの動作確認だけであれば不要です。
- `APP_PASSWORD` または `AUTH_SECRET` を変更すると、ログイン中のすべての端末がログアウトされます。

テーブル（`records` / `exercises` / `long_term_goals` / `frequency_goals`）は初回アクセス時に自動で作成されます。

### 3. 開発サーバーの起動

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) を開くと動作を確認できます。

### その他のコマンド

```bash
pnpm build  # 本番用ビルド
pnpm start  # 本番ビルドの起動（事前に pnpm build が必要）
pnpm lint   # ESLint によるコード検査
```

## デプロイ方法

[Vercel](https://vercel.com/) へのデプロイを想定しています。

1. GitHub リポジトリを Vercel にインポートする
2. **Root Directory** を `training-app` に設定する
3. [Turso](https://turso.tech/) でデータベースを作成し、以下を Vercel の環境変数に設定する
   - `APP_PASSWORD`（ログインパスワード）
   - `AUTH_SECRET`（32文字以上のランダム文字列）
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
4. デプロイを実行する

> 環境変数を設定しない場合、Vercel 上ではファイルシステムが一時的（デプロイごとにリセット）なため、記録したデータが保持されません。本番運用する場合は必ず Turso の接続情報を設定してください。
