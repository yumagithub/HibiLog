<div id="top"></div>

# HibiLog

日々の思い出を記録し、バクを育てるアプリケーション

<div align="center">
  <strong>🌟 Team Hello, Ryudai 🌟</strong>
</div>

## 使用技術一覧

<!-- シールド一覧 -->
<p style="display: inline">
  <!-- フロントエンドのフレームワーク一覧 -->
  <img src="https://img.shields.io/badge/-Next.js-000000.svg?logo=next.js&style=for-the-badge">
  <img src="https://img.shields.io/badge/-React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img src="https://img.shields.io/badge/-TailwindCSS-000000.svg?logo=tailwindcss&style=for-the-badge">
  <img src="https://img.shields.io/badge/-TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white">
  <!-- バックエンド・データベース一覧 -->
  <img src="https://img.shields.io/badge/-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white">
  <img src="https://img.shields.io/badge/-PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white">
  <!-- ツール一覧 -->
  <img src="https://img.shields.io/badge/-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white">
  <img src="https://img.shields.io/badge/-Zustand-000000?style=for-the-badge&logo=react&logoColor=white">
</p>

## 目次

1. [プロジェクトについて](#プロジェクトについて)
2. [環境](#環境)
3. [ディレクトリ構成](#ディレクトリ構成)
4. [開発環境構築](#開発環境構築)
5. [機能概要](#機能概要)
6. [データベース設計](#データベース設計)
7. [トラブルシューティング](#トラブルシューティング)

<br />
<div align="right">
    <a href="#top"><strong>トップへ戻る »</strong></a>
</div>
<br />

## プロジェクトについて

HibiLog は、**Team Hello, Ryudai** によって開発された、日々の思い出を記録しながらバクを育てることができる Web アプリケーションです。
ユーザーが思い出を投稿するたびにバクが成長し、継続的な記録を楽しく促進します。

### 主な特徴

- 📝 日々の思い出を写真で記録
- 🐾 記録するたびに成長するバクのキャラクター
- 📱 レスポンシブデザインによるモバイル対応
- 🔐 匿名利用から正式登録への段階的な移行
- 📊 投稿履歴と統計の可視化

<p align="right">(<a href="#top">トップへ</a>)</p>

## 環境

| 言語・フレームワーク | バージョン |
| -------------------- | ---------- |
| Node.js              | 20.x       |
| Next.js              | 15.x       |
| React                | 19.x       |
| TypeScript           | 5.x        |
| TailwindCSS          | 3.x        |
| Supabase             | 2.x        |
| Zustand              | 5.x        |

その他のパッケージのバージョンは package.json を参照してください

<p align="right">(<a href="#top">トップへ</a>)</p>

## ディレクトリ構成

```
.
├── README.md
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── components.json
├── app/                    # Next.js App Router
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # ホームページ
├── components/            # Reactコンポーネント
│   ├── baku-display.tsx   # バク表示コンポーネント
│   ├── footer.tsx         # フッターコンポーネント
│   ├── memories-tab.tsx   # 思い出タブ
│   ├── settings-tab.tsx   # 設定タブ
│   ├── upload-tab.tsx     # アップロードタブ
│   └── ui/               # UIコンポーネント（shadcn/ui）
├── lib/                  # ユーティリティとライブラリ
│   ├── store.ts          # Zustand状態管理
│   ├── supabase.ts       # Supabaseクライアント
│   └── utils.ts          # ユーティリティ関数
├── public/               # 静的ファイル
│   ├── baku.png          # バクのキャラクター画像
│   └── *.svg             # アイコン類
└── supabase/             # Supabaseプロジェクト設定
    ├── config.toml       # Supabase設定
    └── migrations/       # データベースマイグレーション
        └── 20251021073253_create_initial_tables.sql
```

<p align="right">(<a href="#top">トップへ</a>)</p>

## 開発環境構築

### 前提条件

- Node.js (20.x 以上)
- npm または yarn
- Supabase アカウント

### 1. リポジトリのクローン

```bash
git clone https://github.com/yumagithub/HibiLog.git
cd HibiLog
```

### 2. 依存関係のインストール

```bash
npm install
# または
yarn install
```

### 3. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Site URL (for authentication redirects)
# Local: http://localhost:3000
# Production: https://your-domain.vercel.app
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**本番環境（Vercel）の設定：**

1. Vercel ダッシュボードで環境変数を設定
2. `NEXT_PUBLIC_SITE_URL` を本番ドメイン（例：`https://your-app.vercel.app`）に設定
3. Supabase ダッシュボードの Authentication > URL Configuration で Redirect URLs に本番ドメインを追加：
   - `https://your-app.vercel.app/auth/callback`

### 4. Supabase プロジェクトのセットアップ

1. [Supabase](https://supabase.com/)でプロジェクトを作成
2. `supabase/migrations/` 内のマイグレーションファイルを実行
3. 必要に応じて Storage bucket を設定

### 5. 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
```

http://localhost:3000 にアクセスして動作確認

### 6. ビルドとデプロイ

```bash
# プロダクション用ビルド
npm run build

# ビルドされたアプリの起動
npm start
```

<p align="right">(<a href="#top">トップへ</a>)</p>

## 機能概要

### 🏠 ホーム画面

- バクのキャラクター表示
- 成長状況（サイズ、重さ、空腹度）の確認
- タブによる機能切り替え

### 📝 思い出記録

- テキストによる思い出の記録
- 写真・動画の添付機能
- 日付指定での記録

### 📚 思い出閲覧

- 過去の記録の一覧表示
- 日付やメディアタイプでのフィルタリング
- 詳細表示機能

### 🐾 バク育成システム

- 記録するたびに成長
- サイズと重さの増加
- 空腹度システム

### ⚙️ 設定

- ユーザープロファイル管理
- アカウント設定

<p align="right">(<a href="#top">トップへ</a>)</p>

## データベース設計

### テーブル構成

#### users テーブル

- `id`: ユーザー ID (UUID, Primary Key)
- `is_anonymous`: 匿名フラグ
- `email`: メールアドレス (正式登録時)
- `created_at`: 作成日時

#### memories テーブル

- `id`: 思い出 ID (UUID, Primary Key)
- `user_id`: ユーザー ID (Foreign Key)
- `memory_date`: 思い出の日付
- `text_content`: テキスト内容
- `media_url`: メディアファイル URL
- `media_type`: メディアタイプ ('photo' | 'video')
- `created_at`: 作成日時
- `updated_at`: 更新日時

#### baku_profiles テーブル

- `id`: プロフィール ID (UUID, Primary Key)
- `user_id`: ユーザー ID (Foreign Key, Unique)
- `baku_color`: バクの色
- `size`: サイズ
- `weight`: 重さ
- `hunger_level`: 空腹度 (0-100)
- `last_fed_at`: 最後の投稿日時
- `created_at`: 作成日時
- `updated_at`: 更新日時

### 制約とトリガー

- CHECK 制約によるデータ検証
- Row Level Security (RLS) ポリシー
- `updated_at`の自動更新トリガー

<p align="right">(<a href="#top">トップへ</a>)</p>

## トラブルシューティング

### よくある問題

#### 1. Supabase 接続エラー

```
Error: Invalid Supabase URL or API key
```

**解決方法:**

- `.env.local`の環境変数を確認
- Supabase プロジェクトの設定を確認

#### 2. データベースエラー

```
Error: relation "users" does not exist
```

**解決方法:**

- マイグレーションファイルが正しく実行されているか確認
- Supabase の SQL Editor でテーブルが作成されているか確認

#### 3. メディアアップロードエラー

```
Error: Storage bucket not found
```

**解決方法:**

- Supabase Storage で Bucket が作成されているか確認
- Bucket のポリシー設定を確認

#### 4. Next.js 開発サーバーが起動しない

```
Error: Port 3000 is already in use
```

**解決方法:**

```bash
# 別のポートを指定
npm run dev -- -p 3001

# または使用中のポートを停止
lsof -ti:3000 | xargs kill -9
```

### デバッグ方法

1. **ブラウザ開発者ツール**で Console エラーを確認
2. **Next.js**のサーバーログを確認
3. **Supabase**のログを確認
4. 必要に応じて`console.log`でデバッグ

<p align="right">(<a href="#top">トップへ</a>)</p>

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 貢献

プロジェクトへの貢献を歓迎します。バグ報告や機能提案は[Issues](https://github.com/yumagithub/HibiLog/issues)にお寄せください。

---

<div align="center">
  <h3>🎯 Team Hello, Ryudai</h3>
  <p>Made with ❤️ by Team Hello, Ryudai</p>
  <p>
    <a href="https://github.com/yumagithub">
      <img src="https://img.shields.io/badge/GitHub-yumagithub-181717?style=for-the-badge&logo=github" alt="GitHub">
    </a>
  </p>
</div>
