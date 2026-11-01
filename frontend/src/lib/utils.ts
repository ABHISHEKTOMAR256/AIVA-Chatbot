import clsx, { type ClassValue } from "clsx";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import type { ComplaintCategory, ComplaintStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return format(date, "'Today at' h:mm a");
  }
  if (isYesterday(date)) {
    return format(date, "'Yesterday at' h:mm a");
  }
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function getStatusColor(status: ComplaintStatus): string {
  const colors: Record<ComplaintStatus, string> = {
    submitted: "bg-yellow-100 text-yellow-800 border-yellow-200",
    acknowledged: "bg-blue-100 text-blue-800 border-blue-200",
    in_progress: "bg-orange-100 text-orange-800 border-orange-200",
    resolved: "bg-green-100 text-green-800 border-green-200",
    closed: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
}

export function getCategoryIcon(category: ComplaintCategory): string {
  const icons: Record<ComplaintCategory, string> = {
    electricity: "⚡",
    water_supply: "💧",
    wifi: "📶",
    room_maintenance: "🔧",
    cleaning: "🧹",
    plumbing: "🔩",
    other: "📋",
  };
  return icons[category] || "📋";
}

export function getCategoryLabel(category: ComplaintCategory): string {
  const labels: Record<ComplaintCategory, string> = {
    electricity: "Electricity",
    water_supply: "Water Supply",
    wifi: "Wi-Fi",
    room_maintenance: "Room Maintenance",
    cleaning: "Cleaning",
    plumbing: "Plumbing",
    other: "Other",
  };
  return labels[category] || "Other";
}

export function getStatusLabel(status: ComplaintStatus): string {
  const labels: Record<ComplaintStatus, string> = {
    submitted: "Submitted",
    acknowledged: "Acknowledged",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
  };
  return labels[status] || status;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}
