<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## コミットメッセージ（履歴を項目別に戻しやすくする）

GitHub の履歴検索で絞り込めるよう、**先頭に角括弧の項目ラベル**を付ける。

| プレフィックス | 対象 |
|----------------|------|
| `[司令部タスク]` | 司令ロール別タスクパネル（追加・編集・見た目・保存） |
| `[最優先]` | 今日の最優先 |
| `[毎日]` | 可能な限り毎日する |
| `[KAIRŌ]` | KAIRŌ ブロック全体 |
| `[司令本部]` | 司令のリンク・レイアウト（タスクパネル以外） |
| `[共通]` | localStorage、IME、全体リファクタなど |

例: `[司令部タスク] 白枠の余白を最優先と揃える`

人向けの項目別一覧はリポジトリ直下の `CHANGELOG.md` を更新する。
