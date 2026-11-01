"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime, getStatusColor, getCategoryIcon } from "@/lib/utils";
import { ArrowRight, MapPin, Calendar, Clock } from "lucide-react";
import type { Complaint } from "@/types";

interface ComplaintCardProps {
  complaint: Complaint;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
  const categoryLabels: Record<string, string> = {
    electricity: "Electricity",
    water_supply: "Water Supply",
    wifi: "Wi-Fi",
    room_maintenance: "Room Maintenance",
    cleaning: "Cleaning",
    plumbing: "Plumbing",
    other: "Other",
  };

  const statusVariants: Record<string, "warning" | "info" | "success" | "default"> = {
    submitted: "warning",
    acknowledged: "info",
    in_progress: "info",
    resolved: "success",
    closed: "default",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
            {complaint.reference_number}
          </span>
          <Badge variant={statusVariants[complaint.status] || "default"}>
            {complaint.status.replace("_", " ")}
          </Badge>
        </div>

        <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">
          {complaint.title}
        </h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
          {complaint.description}
        </p>

        <div className="space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">Category:</span>
            <span>{categoryLabels[complaint.category] || complaint.category}</span>
          </div>

          {(complaint.room_number || complaint.location) && (
            <div className="flex items-center gap-1.5 text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>
                Room {complaint.room_number || "N/A"}
                {complaint.location ? ` (${complaint.location})` : ""}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>Reported {formatRelativeTime(complaint.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase text-gray-400">
          Priority: <span className="text-gray-700">{complaint.priority}</span>
        </span>
        <Link
          href={`/complaints/${complaint.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          View Details <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
