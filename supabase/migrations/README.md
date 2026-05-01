## Supabase migrations

このフォルダの SQL は、Supabase の SQL Editor などで **上から順に**適用します。

### 最低限（今回のエラー修正）
- `2026-04-27_add_run_kind_to_diagnosis_runs.sql`
  - `diagnosis_runs.run_kind` を追加し、PostgREST の schema cache をリロードします。
- `2026-05-06_grant_user_profiles_to_authenticated.sql`
  - `user_profiles` に `authenticated` の GRANT を付与（`permission denied for table user_profiles` 対策）。

### 既存のスキーマ一式（初回構築）
既存の `../schema.sql` / `../dayflow.sql` / `../rls.sql` / `../dayflow_rls.sql` は
初回構築用です（実行順は各ファイル先頭コメント参照）。

