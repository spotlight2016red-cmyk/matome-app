## Supabase migrations

このフォルダの SQL は、Supabase の SQL Editor などで **上から順に**適用します。

### 最低限（今回のエラー修正）
- `2026-04-27_add_run_kind_to_diagnosis_runs.sql`
  - `diagnosis_runs.run_kind` を追加し、PostgREST の schema cache をリロードします。
- `2026-05-06_grant_user_profiles_to_authenticated.sql`
  - `user_profiles` に `authenticated` の GRANT を付与（`permission denied for table user_profiles` 対策）。
- `2026-05-07_state_check_daily_view_bonus.sql`
  - 診断完了 +1pt 用。未適用だと `/api/state-check/view-bonus` が失敗しうる（アプリ側は未設定時に穏やく案内するが、本番では適用推奨）。
- `2026-05-08_state_check_small_goal_completion.sql`
  - 小ゴール「完了」ボタンの +pt（重複付与防止ログ）。`POST /api/state-check/complete-small-goal` と併用。

### ポイント（状態チェック）
- 上記「最低限」の `2026-05-07_state_check_daily_view_bonus.sql`：`POST /api/state-check/view-bonus` と併用（同一ユーザー・同一日に +1pt を1回）。

### 既存のスキーマ一式（初回構築）
既存の `../schema.sql` / `../dayflow.sql` / `../rls.sql` / `../dayflow_rls.sql` は
初回構築用です（実行順は各ファイル先頭コメント参照）。

