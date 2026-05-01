export type DiagnosisRunInsert = {
  user_id?: string | null;
  run_kind?: "morning" | "checkin" | "extra" | "night";
  day_key?: string; // YYYY-MM-DD (castable to date)
  result_type: string;
  propulsion_score: number;
  fatigue_score: number;
  confusion_score: number;
  recovery_score: number;
  heat_score: number;
  answers_json: unknown;
  result_summary: string;
  primary_action: string;
  recovery_actions_json: unknown;
  heat_mode_title?: string | null;
  heat_mode_body?: string | null;
  heat_mode_actions_json?: unknown | null;
  note_text?: string | null;
};

export type DiagnosisRunRow = DiagnosisRunInsert & {
  id: string;
  created_at: string;
};

export type DaySummaryInsert = {
  user_id?: string | null;
  day_key: string; // YYYY-MM-DD
  drift_text?: string | null;
  recovered_text?: string | null;
  tomorrow_step_text?: string | null;
};

export type DaySummaryRow = DaySummaryInsert & {
  id: string;
  created_at: string;
  updated_at: string;
};

export type GoalMapInsert = {
  user_id?: string | null;
  big_goal: string;
  middle_goal: string;
  small_goal: string;
  big_goal_purpose?: string | null;
  middle_goal_purpose?: string | null;
  small_goal_purpose?: string | null;
  success_criteria?: string | null;
  big_goal_due_on?: string | null;
  middle_goal_due_on?: string | null;
  small_goal_due_on?: string | null;
};

export type GoalMapRow = GoalMapInsert & {
  id: string;
  created_at: string;
  updated_at: string;
};

export type GoalStepKind = "fixed" | "variable";

export type GoalStepRow = {
  id: string;
  goal_map_id: string;
  step_kind: GoalStepKind;
  title: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type GoalTodayActionOrigin = "fixed_pick" | "variable_pick" | "diagnosis" | "manual";

export type GoalTodayActionStatus = "pending" | "completed" | "skipped";

export type GoalTodayActionRow = {
  id: string;
  user_id: string;
  goal_map_id: string;
  day_key: string;
  title: string;
  origin: GoalTodayActionOrigin;
  linked_step_id: string | null;
  status: GoalTodayActionStatus;
  completed_at: string | null;
  /** DB カラム（`2026-05-10_goal_today_completion_note.sql` 適用後） */
  completion_note?: string | null;
  created_at: string;
  updated_at: string;
};

