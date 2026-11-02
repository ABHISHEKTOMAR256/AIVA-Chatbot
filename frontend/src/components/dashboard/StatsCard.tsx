import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  description?: string;
  trend?: string;
  color?: "indigo" | "amber" | "emerald" | "blue";
}

export function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  color = "indigo",
}: StatsCardProps) {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
  };

  return (
    <div className="glass-card glass-card-hover rounded-3xl p-6 transition-all border border-white/80 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1 font-mono">{value}</p>
        </div>
        <div className={`p-3 rounded-2xl border ${colorMap[color]} shadow-sm`}>
          {icon}
        </div>
      </div>
      {(description || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>{description}</span>
          {trend && <span className="font-semibold text-emerald-600">{trend}</span>}
        </div>
      )}
    </div>
  );
}
