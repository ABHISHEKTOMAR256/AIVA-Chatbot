"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusTimeline } from "@/components/complaints/StatusTimeline";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { getComplaint } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { ArrowLeft, MapPin, Calendar, Clock, MessageSquare, Shield } from "lucide-react";
import type { Complaint } from "@/types";

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getComplaint(id);
        setComplaint(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load complaint details");
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-md mx-auto">
        <p className="text-sm text-red-600 font-semibold mb-4">{error || "Complaint not found"}</p>
        <Button onClick={() => router.push("/complaints")}>Back to Complaints</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/complaints"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Complaints
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-gray-100 text-gray-700">
                {complaint.reference_number}
              </span>
              <Badge variant={complaint.status === "resolved" ? "success" : "warning"}>
                {complaint.status.replace("_", " ")}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{complaint.title}</h1>
          </div>

          <div className="text-right text-xs text-gray-400">
            <span className="block">Submitted {formatRelativeTime(complaint.created_at)}</span>
            <span className="text-[11px] font-semibold text-gray-500 uppercase">
              Priority: {complaint.priority}
            </span>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-gray-50/80 rounded-xl p-4 sm:p-6 border border-gray-200">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
            Resolution Lifecycle
          </h2>
          <StatusTimeline
            currentStatus={complaint.status}
            createdAt={complaint.created_at}
            resolvedAt={complaint.resolved_at}
          />
        </div>

        {/* Location & Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
            <span className="text-gray-400 block mb-1 font-semibold uppercase text-[10px]">
              Location & Room
            </span>
            <div className="flex items-center gap-1.5 font-bold text-gray-800">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>Room {complaint.room_number || "N/A"}</span>
              {complaint.location && (
                <span className="text-gray-500 font-normal">({complaint.location})</span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
            <span className="text-gray-400 block mb-1 font-semibold uppercase text-[10px]">
              Category
            </span>
            <span className="font-bold text-gray-800 capitalize">
              {complaint.category.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            Description
          </h3>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-200 leading-relaxed whitespace-pre-wrap">
            {complaint.description}
          </p>
        </div>

        {/* Staff Reply */}
        {complaint.staff_reply && (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hostel Staff Response</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {complaint.staff_reply}
            </p>
          </div>
        )}

        {/* Photos */}
        {complaint.media_urls && complaint.media_urls.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Attached Evidence
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {complaint.media_urls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg overflow-hidden border border-gray-200 aspect-video block hover:opacity-90"
                >
                  <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
