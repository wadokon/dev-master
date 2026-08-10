# DEV_MASTER 公開手順書

## まず前提の整理（重要）

このアプリの進捗データは **閲覧者それぞれのブラウザ内（localStorage）** に保存されます。
サーバーには何も保存されないため、このまま公開した場合：

- ✅ **他人があなたの進捗を書き換えることは構造上不可能**（他人がチェックを付けても、その人のブラウザ内だけで完結し、あなたのデータには一切影響しない）
- ⚠️ ただし、あなたの進捗が他の閲覧者に見えるわけでもない（全員まっさらな状態から始まる）
- ⚠️ あなた自身も、PCとスマホなど端末をまたぐと進捗は共有されない（JSON書き出し/読み込みで移行は可能）

つまり「自分だけ書き込める」は **そのまま公開するだけで実質達成** されています。
目的に応じて以下の3案から選んでください。

| 案 | できること | 難易度 |
|---|---|---|
| A. そのまま静的公開 | ツールとして公開。進捗は各自のブラウザ内 | ★ |
| B. 自分専用サイトとして保護 | サイト自体を自分しか見られなくする | ★★ |
| C. 進捗をサーバー保存＋本人のみ書き込み | どの端末でも同じ進捗。閲覧は公開、書き込みはトークンを知る本人のみ | ★★★ |

**おすすめ**: まずは案Aで公開し、端末間で進捗を同期したくなったら案Cを追加。

---

## 案A: GitHub Pages / Cloudflare Pages で静的公開

### A-1. GitHub Pages の場合

無料プランでは **公開リポジトリ** が必要です（非公開リポジトリでPagesを使うにはGitHub Pro）。
ソース（スキル一覧）が公開されて問題なければこちらが最短です。

```powershell
cd dev-master\skill-checklist

# 1. Gitリポジトリ化
git init
git add index.html DEPLOY.md
git commit -m "ADD: スキル習熟チェックリストを作成"

# 2. GitHubにリポジトリを作成してpush（個人アカウント wadokon で）
gh repo create wadokon/dev-master --public --source=. --push
```

3. GitHubのリポジトリページ → **Settings → Pages** →
   Source: `Deploy from a branch`、Branch: `main` / `(root)` を選択して Save
4. 数分後 `https://wadokon.github.io/dev-master/` で公開されます

> コミット時の注意: グローバル設定（wadokon / noreplyメール）のままコミットすること。
> `git config --get user.email` が `276261923+wadokon@users.noreply.github.com` であることを確認。

### A-2. Cloudflare Pages の場合（非公開リポジトリでもOK・無料）

1. https://dash.cloudflare.com → **Workers & Pages → Create → Pages**
2. 「Connect to Git」でGitHubリポジトリ（privateでも可）を選択
3. ビルド設定は不要（Framework preset: None、Build command: 空、Output: `/`）
4. `https://<プロジェクト名>.pages.dev` で公開。以後は `git push` するだけで自動デプロイ

---

## 案B: サイト自体を自分専用にする（閲覧も制限）

Cloudflare Pages で公開した上で **Cloudflare Access**（Zero Trust・50ユーザーまで無料）を被せます。

1. Cloudflareダッシュボード → **Zero Trust → Access → Applications → Add an application**
2. Type: `Self-hosted`、対象ドメインに `<プロジェクト名>.pages.dev` を指定
3. ポリシーを作成: Action `Allow`、Include → `Emails` → 自分のメールアドレスを登録
4. 以後、サイトを開くとメール認証（One-time PIN）を要求され、登録メール以外はアクセス不可

---

## 案C: 進捗をサーバー保存し、書き込みは本人だけにする

「閲覧は誰でも可・書き込みは自分だけ・端末間で同期」を実現する構成です。
**Cloudflare Workers + KV** を使い、書き込みだけ秘密トークンで保護します。

### 仕組み

```
閲覧者          GET  /progress   → 誰でも進捗JSONを取得できる（読み取り専用）
あなた          PUT  /progress   → Authorization: Bearer <秘密トークン> が一致した時のみ保存
                                   トークンはWorkerのSecretに保存（コードには書かない）
```

- トークンはあなたのブラウザにだけ保存しておき、チェック操作のたびに自動同期
- トークンを知らない人がPUTしても `401 Unauthorized` で拒否
- 秘密トークンは十分長いランダム文字列（例: `openssl rand -hex 32` で生成）

### 無料枠について

Cloudflare Workers 無料プラン: 10万リクエスト/日、KV: 読み取り10万回/日・書き込み1,000回/日・容量1GB。
クレジットカード登録は不要。書き込みはデバウンス（操作をまとめて800ms後に1回送信）なので枠を使い切ることはまずない。

### Worker のコードと設定（作成済み）

`worker/` フォルダに一式あります:

- `worker/worker.js` … API本体（GET=公開読み取り / PUT=トークン必須）
- `worker/wrangler.jsonc` … 設定ファイル（KVのidだけ書き換えが必要）

### デプロイ手順

事前準備: Node.js と Cloudflareアカウント（無料）

```powershell
cd dev-master\skill-checklist\worker

# 1. Cloudflareにログイン（ブラウザが開く）
npx wrangler login

# 2. KVネームスペースを作成 → 出力された id を wrangler.jsonc の <KV_NAMESPACE_ID> に貼る
npx wrangler kv namespace create PROGRESS

# 3. 秘密トークンを生成して登録（プロンプトに貼り付け）
#    トークン生成例（PowerShell）:
#    -join ((1..48) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
npx wrangler secret put WRITE_TOKEN

# 4. デプロイ → 「https://devmaster-api.xxxx.workers.dev」というURLが表示される
npx wrangler deploy
```

### アプリ側の設定（同期機能は実装済み）

1. `index.html` 内の `const SYNC_URL = "";` にデプロイで表示されたURLを設定:
   ```js
   const SYNC_URL = "https://devmaster-api.xxxx.workers.dev";
   ```
2. サイトを公開（案Aの手順）
3. 公開サイトを自分のブラウザで開き、ツールバー右の **［同期］** ボタンを押して手順3のトークンを入力

### 動作仕様

| 状態 | 表示 | できること |
|---|---|---|
| `SYNC_URL` 未設定 | ステータスバー: TRACKING | 従来通りのローカル単体動作 |
| 同期有効・トークンなし（他人） | VIEWING / SYNC表示 | あなたの進捗を閲覧のみ。クリックしても変化しない。読み込み/リセット非表示 |
| 同期有効・トークンあり（あなた） | TRACKING / SYNC ✓ | チェック操作が自動でサーバー保存され、全端末に反映 |

- 起動時にサーバーの進捗を取得して表示（サーバーが空で手元にデータがある場合は自動で初回アップロード）
- トークンが間違っていると SYNC ✗ 表示＋警告が出る
- トークンを空欄で決定すると、その端末は閲覧専用に戻る

### セキュリティ上の注意

- トークンをコードやリポジトリに **絶対に書かない**（Worker Secretと自分のブラウザにのみ存在）
- トークンが漏れた場合は `wrangler secret put WRITE_TOKEN` で差し替えるだけで無効化できる
- 進捗データに個人情報は含まれないため、漏洩リスクは実質「進捗を勝手に更新される」のみ
