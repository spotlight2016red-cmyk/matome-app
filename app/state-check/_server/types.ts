export type DiagnosisRunInsert = {
  user_id?: string | null;
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

export type GoalMapInsert = {
  user_id?: string | null;
  big_goal: string;
  middle_goal: string;
  small_goal: string;
  big_goal_purpose?: string | null;
  middle_goal_purpose?: string | null;
  small_goal_purpose?: string | null;
  success_criteria?: string | null;
};

export type GoalMapRow = GoalMapInsert & {
  id: string;
  created_at: string;
  updated_at: string;
};

