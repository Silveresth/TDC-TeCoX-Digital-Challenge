export type UserRole = 'ADMIN' | 'JURY' | 'PARTICIPANT';

export interface User {
  id: number;
  username: string;
  email: string;
  participant_code: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  team_group: string;
  phone_number: string;
  avatar: string | null;
  is_active: boolean;
  notes?: string;
  last_activity: string | null;
  date_joined: string;
  total_score?: number;
  completed_trials?: number;
}

export type TrialStatus = 'DRAFT' | 'SCHEDULED' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

export type TrialCategory =
  | 'INFORM_GEN'
  | 'SMARTPHONE'
  | 'ORDINATEUR'
  | 'WINDOWS'
  | 'WORD'
  | 'EXCEL'
  | 'POWERPOINT'
  | 'GRAND_CHALLENGE'
  | 'AUTRE';

export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_TEXT'
  | 'NUMERIC'
  | 'PRACTICAL';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface Option {
  id: number;
  text: string;
  is_correct?: boolean;
  order: number;
}

export interface Question {
  id: number;
  trial?: number;
  question_type: QuestionType;
  prompt: string;
  image: string | null;
  attachment: string | null;
  attachment_name: string;
  points: number;
  order: number;
  difficulty: DifficultyLevel;
  explanation?: string;
  practical_instructions?: string;
  practical_allowed_extensions: string;
  correct_text_answer?: string;
  is_case_sensitive?: boolean;
  options: Option[];
}

export interface Trial {
  id: number;
  title: string;
  slug: string;
  category: TrialCategory;
  description: string;
  instructions: string;
  duration_minutes: number;
  max_score: number;
  weight: number;
  order: number;
  status: TrialStatus;
  starts_at: string | null;
  ends_at: string | null;
  allow_multiple_attempts: boolean;
  shuffle_questions: boolean;
  show_results_immediately: boolean;
  question_count: number;
  total_calculated_points?: number;
  created_at?: string;
  updated_at?: string;
  questions?: Question[];
  user_attempt?: {
    id: number;
    status: AttemptStatus;
    total_score: number;
    percentage: number;
    started_at: string;
    submitted_at: string | null;
    time_spent_seconds: number;
    is_final: boolean;
  } | null;
}

export type AttemptStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'graded'
  | 'expired'
  | 'abandoned';

export interface Answer {
  id: number;
  question?: Question;
  question_id?: number;
  selected_options?: Option[];
  selected_option_ids?: number[];
  text_answer: string;
  file_upload: string | null;
  original_filename: string;
  file_size_bytes?: number;
  score_awarded: number;
  is_graded: boolean;
  is_correct: boolean | null;
  jury_feedback: string;
  graded_by_name?: string | null;
  graded_at?: string | null;
  updated_at: string;
}

export interface Attempt {
  id: number;
  participant?: User;
  trial: number;
  trial_title: string;
  trial_order: number;
  trial_category: TrialCategory;
  status: AttemptStatus;
  started_at: string;
  submitted_at: string | null;
  time_spent_seconds: number;
  remaining_seconds?: number;
  auto_score: number;
  manual_score: number;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  is_final: boolean;
  ip_address?: string;
  answers: Answer[];
  pending_practical_count?: number;
}

export interface CompetitionSetting {
  id: number;
  competition_name: string;
  edition: string;
  is_leaderboard_public: boolean;
  is_competition_active: boolean;
  allow_registrations: boolean;
  banner_message: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  participant_id: number;
  participant_code: string;
  full_name: string;
  team_group: string;
  avatar: string | null;
  total_score: number;
  max_possible_score: number;
  global_percentage: number;
  completed_trials_count: number;
  total_time_seconds: number;
  rank: number;
  trials: Record<number, {
    score: number;
    max_score: number;
    percentage: number;
    status: string;
    time_spent: number;
  }>;
}

export interface DashboardStats {
  kpis: {
    total_participants: number;
    active_participants: number;
    online_participants: number;
    total_trials: number;
    open_trials: number;
    in_progress_trials: number;
    completed_trials: number;
    total_attempts: number;
    submitted_attempts: number;
    pending_practicals: number;
    average_percentage: number;
  };
  top_participant: {
    id: number;
    name: string;
    code: string;
    score: number;
    avatar: string | null;
  } | null;
  easiest_trial: {
    id: number;
    title: string;
    average_score_pct: number;
  } | null;
  hardest_trial: {
    id: number;
    title: string;
    average_score_pct: number;
  } | null;
  trial_stats: Array<{
    id: number;
    order: number;
    title: string;
    category: TrialCategory;
    status: TrialStatus;
    max_score: number;
    attempts_count: number;
    average_score_pct: number;
    average_time_minutes: number;
  }>;
  distribution: {
    '0_49': number;
    '50_69': number;
    '70_84': number;
    '85_100': number;
  };
  recent_logs: AuditLog[];
}

export interface AuditLog {
  id: number;
  user: User | null;
  action: string;
  action_display: string;
  description: string;
  ip_address: string | null;
  created_at: string;
}
