import { createClient } from "@/lib/supabase/client";
import type {
  Conversation,
  Message,
  Complaint,
  LostFoundItem,
  DashboardStats,
  Feedback,
  AdminStats,
  HandoverRequest,
  KnowledgeDoc,
  ConversationProgress,
  MediaFile,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (session?.access_token) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "An error occurred";
    try {
      const data = await response.json();
      message = data.detail || data.message || message;
    } catch {
      message = response.statusText;
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ─── Conversations & Chat ───────────────────────────────────────────────────

export async function getConversations(): Promise<Conversation[]> {
  try {
    const res = await apiClient<{ conversations?: Conversation[] } | Conversation[]>(
      "/api/conversations"
    );
    if (Array.isArray(res)) return res;
    return res.conversations || [];
  } catch {
    return [];
  }
}

export async function getConversation(id: string): Promise<{
  conversation: Conversation;
  messages: Message[];
}> {
  return apiClient(`/api/conversations/${id}`);
}

export async function createConversation(title?: string): Promise<Conversation> {
  return {
    id: "",
    user_id: "",
    title: title || "New Conversation",
    status: "active",
    platform: "web",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function sendMessage(
  message: string,
  conversationId?: string
): Promise<{ response: string; conversation_id: string; message_id: string }> {
  return apiClient("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, conversation_id: conversationId }),
  });
}

export async function requestHandover(
  conversationId: string,
  reason: string
): Promise<HandoverRequest> {
  return apiClient<HandoverRequest>("/api/admin/handovers", {
    method: "POST",
    body: JSON.stringify({ conversation_id: conversationId, reason }),
  });
}

// ─── Complaints ──────────────────────────────────────────────────────────────

export async function getComplaints(status?: string): Promise<Complaint[]> {
  const qs = status ? `?status=${status}` : "";
  return apiClient<Complaint[]>(`/api/complaints${qs}`);
}

export async function getComplaint(id: string): Promise<Complaint> {
  return apiClient<Complaint>(`/api/complaints/${id}`);
}

export async function createComplaint(data: {
  category: string;
  title: string;
  description: string;
  location?: string;
  room_number?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  media_urls?: string[];
}): Promise<Complaint> {
  return apiClient<Complaint>("/api/complaints", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Lost & Found ────────────────────────────────────────────────────────────

export async function searchLostFound(params?: {
  query?: string;
  item_type?: string;
  category?: string;
}): Promise<LostFoundItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.query) searchParams.set("query", params.query);
  if (params?.item_type) searchParams.set("item_type", params.item_type);
  if (params?.category) searchParams.set("category", params.category);
  const qs = searchParams.toString();
  return apiClient<LostFoundItem[]>(`/api/lost-found${qs ? `?${qs}` : ""}`);
}

export async function createLostFound(data: {
  item_type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  location: string;
  date_occurred: string;
  contact_preference: string;
  is_anonymous: boolean;
  media_urls?: string[];
}): Promise<LostFoundItem> {
  return apiClient<LostFoundItem>("/api/lost-found", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Media ───────────────────────────────────────────────────────────────────

export async function uploadMedia(
  file: File,
  complaintId?: string,
  lostFoundId?: string
): Promise<MediaFile> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const formData = new FormData();
  formData.append("file", file);
  if (complaintId) formData.append("complaint_id", complaintId);
  if (lostFoundId) formData.append("lost_found_id", lostFoundId);

  const headers: HeadersInit = {};
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_URL}/api/media/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError("Failed to upload file", response.status);
  }

  return response.json();
}

export function getMediaUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const adminStats = await apiClient<any>("/api/admin/dashboard");
    return {
      total_complaints: adminStats.total_complaints ?? 0,
      open_complaints: adminStats.open_complaints ?? 0,
      resolved_complaints: adminStats.resolved_complaints ?? 0,
      total_conversations: adminStats.total_conversations ?? 0,
    };
  } catch {
    return {
      total_complaints: 0,
      open_complaints: 0,
      resolved_complaints: 0,
      total_conversations: 0,
    };
  }
}

export async function submitFeedback(data: {
  conversation_id: string;
  rating: number;
  comment?: string;
}): Promise<Feedback> {
  return apiClient<Feedback>(`/api/conversations/${data.conversation_id}/feedback`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  return apiClient<AdminStats>("/api/admin/dashboard");
}

export async function getAdminComplaints(params?: {
  category?: string;
  status?: string;
  priority?: string;
}): Promise<Complaint[]> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.priority) searchParams.set("priority", params.priority);
  const qs = searchParams.toString();
  const res = await apiClient<{ complaints?: Complaint[] } | Complaint[]>(
    `/api/admin/complaints${qs ? `?${qs}` : ""}`
  );
  if (Array.isArray(res)) return res;
  return res.complaints || [];
}

export async function updateComplaint(
  id: string,
  data: {
    status?: string;
    priority?: string;
    assigned_staff_id?: string;
    internal_notes?: string;
    staff_reply?: string;
  }
): Promise<Complaint> {
  return apiClient<Complaint>(`/api/admin/complaints/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getHandovers(): Promise<HandoverRequest[]> {
  return apiClient<HandoverRequest[]>("/api/admin/handovers");
}

export async function claimHandover(id: string): Promise<HandoverRequest> {
  return apiClient<HandoverRequest>(`/api/admin/handovers/${id}/claim`, {
    method: "POST",
  });
}

export async function replyHandover(
  id: string,
  message: string
): Promise<Message> {
  return apiClient<Message>(`/api/admin/handovers/${id}/reply`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function resolveHandover(id: string): Promise<any> {
  return apiClient<any>(`/api/admin/handovers/${id}/resolve`, {
    method: "POST",
  });
}

export async function exportAnalytics(): Promise<Blob> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {};
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_URL}/api/admin/analytics/export`, {
    headers,
  });

  if (!response.ok) {
    throw new ApiError("Failed to export analytics", response.status);
  }

  return response.blob();
}

export async function getConversationProgress(): Promise<ConversationProgress> {
  return apiClient<ConversationProgress>("/api/admin/analytics/progress");
}

export async function getKnowledgeDocs(): Promise<KnowledgeDoc[]> {
  return apiClient<KnowledgeDoc[]>("/api/admin/knowledge");
}

export async function addKnowledgeDoc(data: {
  title: string;
  content: string;
  category: string;
}): Promise<KnowledgeDoc> {
  return apiClient<KnowledgeDoc>("/api/admin/knowledge", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteKnowledgeDoc(id: string): Promise<void> {
  return apiClient<void>(`/api/admin/knowledge/${id}`, {
    method: "DELETE",
  });
}
