export type MetricPoint = { label: string; value: number };

export type Metrics = {
  total_users: number;
  new_users_7d: number;
  active_users_7d: number;
  contributors: number;
  professionals: number;
  stories_pending: number;
  stories_published: number;
  posts_published: number;
  ai_rejection_rate: number;
  bookings_queued: number;
  bookings_completed: number;
  median_wait_days: number;
  chat_questions_7d: number;
  chat_refusal_rate: number;
  reminders_set: number;
  cycle_trackers: number;
  signups_by_day: MetricPoint[];
  users_by_country: MetricPoint[];
  content_by_topic: MetricPoint[];
  bookings_by_status: MetricPoint[];
};

export type User = {
  id: number;
  alias: string;
  full_name: string | null;
  email: string;
  role: string;
  avatar: string;
  country: string;
  language: string;
  birth_year: number | null;
  can_post: boolean;
  posting_banned: boolean;
  abusive_strikes: number;
  mfa_enabled: boolean;
  is_active: boolean;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
};

export type Story = {
  id: number;
  title: string;
  body: string;
  status: string;
  ai_verdict: string | null;
  ai_reasons: string | null;
  admin_note: string | null;
  like_count: number;
  rating_count: number;
  created_at: string;
  published_at: string | null;
};

export type Post = {
  id: number;
  title: string;
  body: string;
  topic_id: number;
  author_alias: string;
  author_avatar: string;
  author_role: string;
  like_count: number;
  average_rating: number;
  rating_count: number;
  status: string;
  ai_verdict: string | null;
  ai_reasons: string | null;
  created_at: string;
};

export type Question = { id: number; text: string; topic_hint: string | null; status: string; assignee_id: number | null; created_at: string };

export type Professional = {
  id: number;
  user_id: number;
  display_name: string;
  title: string;
  specialty: string;
  bio: string;
  languages: string;
  avatar: string;
  license_number: string;
  daily_capacity: number;
  is_active: boolean;
  created_at: string;
};

export type Booking = {
  id: number;
  member_id: number;
  topic: string;
  status: string;
  professional_id: number | null;
  scheduled_for: string | null;
  referral_status: string | null;
  created_at: string;
};

export type Curated = {
  id: number;
  kind: string;
  country: string;
  title: string;
  body: string;
  source_title: string;
  source_url: string;
  display_date: string | null;
  status: string;
  created_at: string;
};

export type Lesson = {
  id: number;
  topic: string;
  title: string;
  title_rw: string | null;
  summary: string;
  minutes: number;
  is_preview: boolean;
  status: string;
  body?: string;
  body_rw?: string | null;
  source_title?: string;
  source_url?: string;
};

export type Opportunity = {
  id: number;
  category: string;
  title: string;
  organization: string;
  description: string;
  country: string;
  cost_level: string;
  deadline: string | null;
  url: string;
  status: string;
};

export type Topic = { id: number; title: string; title_rw: string | null; description: string; starts_on: string; ends_on: string };
export type Challenge = { id: number; title: string; title_rw: string | null; description: string; category: string; points: number; starts_on: string; ends_on: string };
export type Celebration = { id: number; month: number; day: number; title: string; title_rw: string | null; message: string; theme_color: string; source_url: string };
export type Emergency = { id: number; country: string; label: string; label_rw: string | null; number: string; category: string; priority: number };
export type Audit = { id: number; actor_id: number | null; actor_role: string | null; action: string; entity: string; entity_id: string | null; meta: string; ip_address: string | null; created_at: string };
export type Session = { id: number; user_agent: string | null; ip_address: string | null; created_at: string; expires_at: string };
