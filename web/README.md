# AI-CEO ダッシュボード

`note-business` のAI-CEOフレームワーク向けGUI。承認待ちの企画レビューと、CEOからの依頼投稿をスマホ/PCから行うためのNext.jsアプリ。

実際のAI実行(市場調査・企画・下書き作成)はこのアプリではなく、Claude Codeのクラウドルーチンが別途担当する。このアプリは「見る・依頼する・承認する」ためのGUIに徹する。

## セットアップ(初回のみ)

1. [Supabase](https://supabase.com/)で新規プロジェクトを作成する(GitHubログイン、カード登録不要)
2. Supabaseダッシュボードの **SQL Editor** で `supabase/schema.sql` の中身を貼り付けて実行する
3. Supabaseの **Project Settings > API** から `Project URL` と `anon public` キーを控える
4. `.env.example` を `.env.local` にコピーし、`SUPABASE_URL` / `SUPABASE_ANON_KEY` / `DASHBOARD_PASSWORD`(好きなパスフレーズ) / `SESSION_SECRET`(`openssl rand -base64 32` などで生成)を埋める

## ローカル起動

```bash
npm install
npm run dev
```

`http://localhost:3000` を開き、`DASHBOARD_PASSWORD` で設定したパスフレーズでログインする。

## デプロイ(Vercel)

1. [Vercel](https://vercel.com/)にGitHubアカウントでログインし、このリポジトリをインポートする
2. **Root Directory** を `web` に設定する
3. Environment Variablesに `.env.local` と同じ4つ(`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DASHBOARD_PASSWORD`, `SESSION_SECRET`)を設定する
4. デプロイ後に発行されるURLへスマホ/PCからアクセスできる

## 構成

- `app/` — ページ(`/`, `/ideas`, `/ideas/[id]`, `/requests`, `/login`)とServer Actions(`app/actions.ts`)
- `lib/` — Supabaseクライアント、認証(共有パスフレーズ+署名付きCookie)、データ取得
- `proxy.ts` — 未ログイン時に`/login`へリダイレクトする(Next.js 16のMiddleware後継)
- `supabase/schema.sql` — `requests` / `content_ideas` テーブルの定義

## データの流れ

- CEOが `/requests` から依頼を投稿 → `requests` テーブルに `status=queued` で保存
- Claude Codeのクラウドルーチンが定期実行され、`requests` を処理しつつ、note向けの市場調査・企画を `content_ideas` に `status=draft` で追加
- CEOが `/ideas` で内容を確認し、承認/却下(外部への公開・投稿は行わない。承認後の実際の投稿はCEOが手動で行う)
