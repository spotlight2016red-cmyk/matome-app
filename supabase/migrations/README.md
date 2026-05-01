## Supabase migrations

このフォルダの SQL は、Supabase の SQL Editor などで **上から順に**適用します。

### 最低限（今回のエラー修正）
- `2026-04-27_add_run_kind_to_diagnosis_runs.sql`
  - `diagnosis_runs.run_kind` を追加し、PostgREST の schema cache をリロードします。
- `2026-05-06_grant_user_profiles_to_authenticated.sql`
  - `user_profiles` に `authenticated` の GRANT を付与（`permission denied for table user_profiles` 対策）。
- `2026-05-07_state_check_daily_view_bonus.sql`
  - 診断完了 +1pt 用。未適用だと `/api/state-check/view-bonus` が失敗しうる（アプリ側は未設定時に穏やく案内するが、本番では適用推奨）。
- `2026-05-09_agari_goal_steps_and_today.sql`
  - AGARI ゴール：大・中・小の任意期日、`goal_steps`（固定／変動の1歩プール）、`goal_today_actions`（今日の1歩）とポイント用 `goal_today_action_point_awards`。
- `2026-05-10_goal_today_completion_note.sql`
  - `goal_today_actions.completion_note`（完了後の任意メモ）。

### ポイント（状態チェック）
- 上記「最低限」の `2026-05-07_state_check_daily_view_bonus.sql`：`POST /api/state-check/view-bonus` と併用（同一ユーザー・同一日に +1pt を1回）。

### 既存のスキーマ一式（初回構築）
既存の `../schema.sql` / `../dayflow.sql` / `../rls.sql` / `../dayflow_rls.sql` は
初回構築用です（実行順は各ファイル先頭コメント参照）。

