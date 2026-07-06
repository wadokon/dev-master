# DEV_MASTER — スキル習熟チェックリスト

フロントエンド・バックエンド・インフラの3分野、約300項目のスキルを
「未着手 → 学習中 → 習得済み」の3段階で管理するチェックリストWebアプリ。

**Demo: https://xxxx.github.io/dev-master/**

![status](https://img.shields.io/badge/frontend-106%20items-ff9e64)
![status](https://img.shields.io/badge/backend-106%20items-9ece6a)
![status](https://img.shields.io/badge/infra-91%20items-7aa2f7)

## 特徴

- **3段階トグル** — クリックで `[ ]` 未着手 → `[~]` 学習中(0.5pt) → `[x]` 習得済み(1pt)
- **レベルゲージ** — 分野ごとの習熟度を Lv.0〜100 で可視化。総合レベルも表示
- **フィルタ / 検索** — `--todo` `--wip` `--done` の状態フィルタと grep 風のインクリメンタル検索
- **サーバー同期（任意）** — Cloudflare Workers + KV で進捗を保存し、端末をまたいで同期。
  閲覧は誰でも可、**書き込みは秘密トークンを知る本人のみ**
- **ビルド不要** — 単一HTMLファイル。ブラウザで開くだけで動く（同期未設定ならlocalStorageのみで完結）
- デザインは [Tokyo Night](https://github.com/enkia/tokyo-night-vscode-theme) 系パレットのエディタ風ダークテーマ

## 構成

```
index.html          アプリ本体（単一ファイル・依存なし）
worker/
  worker.js         進捗同期API（Cloudflare Workers）
  wrangler.jsonc    Worker設定
DEPLOY.md           公開・同期セットアップの詳細手順
```

### 同期の仕組み

```
閲覧者   GET  →  Workers + KV   … 進捗JSONを誰でも読み取り可（閲覧専用表示）
本人     PUT  →  Workers + KV   … Authorization: Bearer <WRITE_TOKEN> 一致時のみ保存
```

トークンは Worker の Secret と本人のブラウザ（localStorage）にのみ存在し、
リポジトリ・配信ファイルには含まれない。詳細は [DEPLOY.md](DEPLOY.md) を参照。

## 使い方

1. https://xxxx.github.io/dev-master/ を開く（またはこのリポジトリを clone して `index.html` を開く）
2. 項目をクリックして状態を切り替える
3. 進捗は自動保存。「書き出し / 読み込み」でJSONバックアップも可能

### 自分用にカスタマイズするには

1. このリポジトリを fork
2. `index.html` 内の `DATA` 配列を編集してスキル項目を増減
3. 同期機能を使う場合は `DEPLOY.md` の手順で Worker をデプロイし、`SYNC_URL` を自分のWorker URLに変更
4. GitHub Pages を有効化して公開

## ライセンス

MIT
