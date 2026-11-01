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
