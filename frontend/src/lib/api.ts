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
  TelegramDashboardStats,
  TelegramUserItem,
  TelegramUserListResponse,
  AdminConversationItem,
  AdminConversationDetail,
  BotHealthResponse,
  AdminLoginResponse,
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

  let token = session?.access_token;
  if (!token && typeof window !== "undefined") {
    token =
      localStorage.getItem("aiva_admin_token") ||
      localStorage.getItem("aiva_firebase_token") ||
      undefined;
  }

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (err: any) {
    const msg = err?.message || "";
    if (
      msg.includes("Failed to fetch") ||
      msg.includes("NetworkError") ||
      err?.name === "TypeError"
    ) {
      throw new ApiError(
        `Cannot connect to AIVA backend (${API_URL}). Please ensure the backend server is running.`,
        503
      );
    }
    throw new ApiError(msg || "Network request failed", 500);
  }

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

export function getMediaUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/media/") || path.startsWith("media/")) {
    const cleanBase = API_URL.replace(/\/$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !path.startsWith("data/uploads")) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
  }
  const cleanBase = API_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
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

// ── 3D Futuristic Admin Dashboard APIs ───────────────────────────────────────

export async function adminLogin(
  username_or_email: string,
  password: string
): Promise<AdminLoginResponse> {
  const isDemoCredential =
    (username_or_email === "admin@aiva.local" || username_or_email === "admin") &&
    password === "Admin@AIVA2026";

  try {
    const res = await apiClient<AdminLoginResponse>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username_or_email, password }),
    });
    if (typeof window !== "undefined" && res.access_token) {
      localStorage.setItem("aiva_admin_token", res.access_token);
      localStorage.setItem("aiva_admin_user", JSON.stringify(res.user));
    }
    return res;
  } catch (err: any) {
    const isNetworkError =
      err?.message?.includes("Failed to fetch") ||
      err?.message?.includes("NetworkError") ||
      err?.name === "TypeError" ||
      err?.status === 503 ||
      !err?.status;

    // Resilient offline fallback: If backend server is offline or unreachable,
    // allow seamless admin login when the demo credentials are provided.
    if (isNetworkError && isDemoCredential) {
      const demoRes: AdminLoginResponse = {
        access_token: "demo_admin_jwt_" + Date.now(),
        token_type: "bearer",
        user: {
          id: "4991bb3c-2798-43df-b39a-0cc5ea3d10ee",
          email: "admin@aiva.local",
          full_name: "System Administrator (Demo Mode)",
          role: "admin",
        },
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("aiva_admin_token", demoRes.access_token);
        localStorage.setItem("aiva_admin_user", JSON.stringify(demoRes.user));
      }
      return demoRes;
    }

    if (isNetworkError) {
      throw new ApiError(
        "Backend server is offline (http://localhost:8000). Please start the backend or use the Demo Auto-Fill credentials.",
        503
      );
    }

    throw err;
  }
}

export async function adminLogout(): Promise<void> {
  try {
    await apiClient<void>("/api/admin/logout", { method: "POST" });
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem("aiva_admin_token");
      localStorage.removeItem("aiva_admin_user");
    }
  }
}

export async function getAdminProfile(): Promise<any> {
  try {
    return await apiClient<any>("/api/admin/me");
  } catch (err) {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("aiva_admin_user");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    throw err;
  }
}

export const getAdminMe = getAdminProfile;
export const getAllComplaints = getAdminComplaints;
export const updateComplaintStatus = updateComplaint;

export async function getTelegramDashboardStats(): Promise<TelegramDashboardStats> {
  return apiClient<TelegramDashboardStats>("/api/admin/stats");
}

export async function getAnalyticsCharts(
  days: number = 14
): Promise<{ timeline: Array<any> }> {
  return apiClient<{ timeline: Array<any> }>(
    `/api/admin/analytics/charts?days=${days}`
  );
}

export async function getTelegramUsers(params: {
  q?: string;
  has_phone?: boolean;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<TelegramUserListResponse> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.has_phone !== undefined) search.set("has_phone", String(params.has_phone));
  if (params.status) search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));
  if (params.page_size) search.set("page_size", String(params.page_size));

  return apiClient<TelegramUserListResponse>(
    `/api/admin/telegram/users?${search.toString()}`
  );
}

export async function getTelegramUserDetail(
  userId: string
): Promise<TelegramUserItem> {
  return apiClient<TelegramUserItem>(`/api/admin/telegram/users/${userId}`);
}

export async function getTelegramUserMessages(
  userId: string,
  limit: number = 100
): Promise<Array<any>> {
  return apiClient<Array<any>>(
    `/api/admin/telegram/users/${userId}/messages?limit=${limit}`
  );
}

export async function exportTelegramUsersCsv(): Promise<Blob> {
  let token: string | undefined;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("aiva_admin_token") || undefined;
  }
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/admin/telegram/users/export/csv`, {
    headers,
    credentials: "include",
  });
  if (!response.ok) {
    throw new ApiError("Failed to export Telegram users CSV", response.status);
  }
  return response.blob();
}

export async function getLiveConversations(params: {
  q?: string;
  status?: string;
  handling_mode?: string;
  page?: number;
  page_size?: number;
}): Promise<{ conversations: AdminConversationItem[]; total: number; page: number; page_size: number }> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.handling_mode) search.set("handling_mode", params.handling_mode);
  if (params.page) search.set("page", String(params.page));
  if (params.page_size) search.set("page_size", String(params.page_size));

  return apiClient<any>(`/api/admin/live/conversations?${search.toString()}`);
}

export async function getLiveConversationDetail(
  conversationId: string
): Promise<AdminConversationDetail> {
  return apiClient<AdminConversationDetail>(
    `/api/admin/live/conversations/${conversationId}`
  );
}

export async function pollConversationMessages(
  conversationId: string,
  since: string
): Promise<{ messages: Array<any> }> {
  return apiClient<{ messages: Array<any> }>(
    `/api/admin/live/conversations/${conversationId}/poll?since=${encodeURIComponent(since)}`
  );
}

export async function getBotHealthStatus(): Promise<BotHealthResponse> {
  return apiClient<BotHealthResponse>("/api/admin/bot/status");
}

export async function getGuestPreview(): Promise<any> {
  return apiClient<any>("/api/admin/guest/preview");
}

export async function sendManualReply(
  conversationId: string,
  content: string
): Promise<{ id: string; conversation_id: string; sender_type: string; content: string; telegram_sent: boolean }> {
  return apiClient<{ id: string; conversation_id: string; sender_type: string; content: string; telegram_sent: boolean }>(
    `/api/admin/conversations/${conversationId}/manual-reply`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    }
  );
}

export async function updateConversationMode(
  conversationId: string,
  mode: string
): Promise<{ conversation_id: string; handling_mode: string; message: string }> {
  return apiClient<{ conversation_id: string; handling_mode: string; message: string }>(
    `/api/admin/conversations/${conversationId}/mode`,
    {
      method: "POST",
      body: JSON.stringify({ mode }),
    }
  );
}

export async function getAdminMedia(params: {
  q?: string;
  file_type?: string;
  page?: number;
  page_size?: number;
} = {}): Promise<{ media: any[]; total: number; page: number; page_size: number }> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.file_type) search.set("file_type", params.file_type);
  if (params.page) search.set("page", String(params.page));
  if (params.page_size) search.set("page_size", String(params.page_size));

  return apiClient<{ media: any[]; total: number; page: number; page_size: number }>(
    `/api/admin/media?${search.toString()}`
  );
}

export async function getAdminSessions(params: {
  page?: number;
  page_size?: number;
} = {}): Promise<{ sessions: any[]; total: number; page: number; page_size: number }> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.page_size) search.set("page_size", String(params.page_size));

  return apiClient<{ sessions: any[]; total: number; page: number; page_size: number }>(
    `/api/admin/sessions?${search.toString()}`
  );
}

export async function getAdminLostFound(params: {
  query?: string;
  item_type?: string;
  category?: string;
  status?: string;
} = {}): Promise<LostFoundItem[]> {
  const search = new URLSearchParams();
  if (params.query) search.set("query", params.query);
  if (params.item_type) search.set("item_type", params.item_type);
  if (params.category) search.set("category", params.category);
  if (params.status) search.set("status", params.status);

  return apiClient<LostFoundItem[]>(`/api/admin/lost-found?${search.toString()}`);
}

export async function createAdminLostFound(data: any): Promise<LostFoundItem> {
  return apiClient<LostFoundItem>("/api/admin/lost-found", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAdminLostFoundStatus(
  itemId: string,
  status: string
): Promise<LostFoundItem> {
  return apiClient<LostFoundItem>(`/api/admin/lost-found/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function createAdminComplaint(data: any): Promise<Complaint> {
  return apiClient<Complaint>("/api/admin/complaints", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

