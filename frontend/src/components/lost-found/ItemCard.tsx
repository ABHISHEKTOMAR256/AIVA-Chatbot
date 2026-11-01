"use client";

import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";
import { MapPin, Calendar, Tag, ShieldCheck, Mail } from "lucide-react";
import type { LostFoundItem } from "@/types";

interface ItemCardProps {
  item: LostFoundItem;
}

export function ItemCard({ item }: ItemCardProps) {
  const isLost = item.item_type === "lost";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              isLost
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {isLost ? "Lost Item" : "Found Item"}
          </span>
          <Badge variant={item.status === "open" ? "warning" : "success"}>
            {item.status}
          </Badge>
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        <div className="space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="capitalize">{item.category}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>{item.location}</span>
          </div>

          <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>Date: {item.date_occurred}</span>
          </div>
        </div>

        {item.media_urls && item.media_urls.length > 0 && (
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
            <img
              src={item.media_urls[0]}
              alt={item.title}
              className="w-full h-36 object-cover"
            />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          {item.is_anonymous ? "Reported Anonymously" : `By ${item.user?.full_name || "Resident"}`}
        </span>
        <button
          onClick={() => {
            alert("Contact details are kept private. Please consult the hostel warden desk or contact through AIVA chat to verify ownership.");
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <Mail className="w-3 h-3" />
          Claim / Contact
        </button>
      </div>
    </div>
  );
}
