export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: "student" | "admin" | "staff";
  room_number?: string;
  hostel_block?: string;
  phone?: string;
  telegram_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  status: "active" | "closed" | "handed_over";
  platform: "web" | "telegram";
  created_at: string;
  updated_at: string;
  last_message?: string;
  message_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system" | "staff";
  content: string;
  media_url?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface Complaint {
  id: string;
  user_id: string;
  reference_number: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  location?: string;
  room_number?: string;
  status: ComplaintStatus;
  priority: "low" | "medium" | "high" | "urgent";
  assigned_to?: string;
  media_urls?: string[];
  staff_notes?: string;
  staff_reply?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  user?: Pick<User, "full_name" | "email" | "room_number">;
  status_history?: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
  status: ComplaintStatus;
  changed_at: string;
  changed_by?: string;
  note?: string;
}

export type ComplaintCategory =
  | "electricity"
  | "water_supply"
  | "wifi"
  | "room_maintenance"
  | "cleaning"
  | "plumbing"
  | "other";

export type ComplaintStatus =
  | "submitted"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "closed";

export interface LostFoundItem {
  id: string;
  user_id: string;
  item_type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  location: string;
  date_occurred: string;
  status: "open" | "claimed" | "returned" | "closed";
  media_urls?: string[];
  contact_preference: "email" | "phone" | "chat";
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  user?: Pick<User, "full_name" | "email">;
}

export interface Feedback {
  id: string;
  user_id: string;
  conversation_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface HandoverRequest {
  id: string;
  conversation_id: string;
  user_id: string;
  reason: string;
  status: "pending" | "claimed" | "resolved";
  claimed_by?: string;
  conversation_snippet?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  user?: Pick<User, "full_name" | "email" | "room_number">;
  claimed_by_user?: Pick<User, "full_name">;
}

export interface DashboardStats {
  total_complaints: number;
  open_complaints: number;
  resolved_complaints: number;
  total_conversations: number;
}

export interface ConversationProgress {
  total: number;
  target: number;
  percentage: number;
}

export interface MediaFile {
  id: string;
  url: string;
  filename: string;
  content_type: string;
  size: number;
  created_at: string;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AdminStats {
  total_users: number;
  total_conversations: number;
  total_messages: number;
  total_complaints: number;
  open_complaints: number;
  pending_handovers: number;
  conversation_progress: ConversationProgress;
  daily_conversations: { date: string; count: number }[];
  common_categories: { category: string; count: number }[];
  platform_usage: { platform: string; count: number }[];
  avg_response_time_seconds: number;
}

export interface AnalyticsExport {
  url: string;
  filename: string;
}

// ── 3D Control Center Admin Types ───────────────────────────────────────

export interface TelegramDashboardStats {
  total_telegram_users: number;
  total_conversations: number;
  total_messages_received: number;
  total_bot_replies: number;
  active_users_today: number;
  active_users_7d: number;
  avg_response_time_ms: number;
  failed_messages: number;
  bot_online: boolean;
  bot_username: string;
  uptime_seconds?: number;
}

export interface TelegramUserItem {
  id: string;
  telegram_id?: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email: string;
  phone_number?: string;
  phone_shared_at?: string;
  first_interaction: string;
  last_interaction?: string;
  total_messages_sent: number;
  total_conversations: number;
  last_message_preview?: string;
  status: "active" | "inactive";
}

export interface TelegramUserListResponse {
  users: TelegramUserItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminConversationItem {
  id: string;
  user_id: string;
  user_name?: string;
  telegram_username?: string;
  telegram_id?: number;
  phone_number?: string;
  platform: string;
  platform_conversation_id?: string;
  title?: string;
  status: string;
  handling_mode: string;
  message_count: number;
  last_message_text?: string;
  last_message_time?: string;
  created_at: string;
}

export interface AdminConversationDetail {
  conversation: AdminConversationItem;
  messages: Array<{
    id: string;
    sender_type: "user" | "ai" | "system" | "staff";
    content: string;
    message_type: string;
    processing_status?: string;
    response_time_ms?: number;
    created_at: string;
  }>;
  user_profile: TelegramUserItem;
}

export interface BotHealthResponse {
  bot_name: string;
  bot_username: string;
  bot_status: string;
  api_status: string;
  database_status: string;
  database_latency_ms: number;
  model_provider: string;
  model_name: string;
  last_message_at?: string;
  recent_errors_count: number;
  ollama_available: boolean;
  installed_models: string[];
}

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name?: string;
    role: string;
  };
}
