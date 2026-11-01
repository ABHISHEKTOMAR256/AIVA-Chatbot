import { CheckCircle2, Circle, Clock } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { ComplaintStatus } from "@/types";

interface StatusTimelineProps {
  currentStatus: ComplaintStatus;
  createdAt: string;
  resolvedAt?: string;
}

export function StatusTimeline({
  currentStatus,
  createdAt,
  resolvedAt,
}: StatusTimelineProps) {
  const steps: { key: ComplaintStatus; label: string; desc: string }[] = [
    { key: "submitted", label: "Submitted", desc: "Complaint logged by student" },
    { key: "acknowledged", label: "Acknowledged", desc: "Verified by hostel desk" },
    { key: "in_progress", label: "In Progress", desc: "Technician assigned" },
    { key: "resolved", label: "Resolved", desc: "Issue fixed and verified" },
  ];

  const statusOrder: Record<ComplaintStatus, number> = {
    submitted: 0,
    acknowledged: 1,
    in_progress: 2,
    resolved: 3,
    closed: 4,
  };

  const currentIndex = statusOrder[currentStatus] ?? 0;

  return (
    <div className="py-4">
      <div className="relative flex items-center justify-between">
        {/* Connecting Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-gray-200 z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
          style={{ width: `${Math.min((currentIndex / (steps.length - 1)) * 100, 100)}%` }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? "bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50"
                    : "bg-white text-gray-400 border-2 border-gray-300"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              <span
                className={`mt-2 text-xs font-semibold ${
                  isCurrent
                    ? "text-emerald-700"
                    : isCompleted
                    ? "text-gray-900"
                    : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
              <span className="text-[10px] text-gray-400 max-w-[80px] text-center hidden sm:block">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
