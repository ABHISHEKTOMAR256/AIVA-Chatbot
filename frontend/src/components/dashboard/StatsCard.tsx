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
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      {(description || trend) && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>{description}</span>
          {trend && <span className="font-semibold text-emerald-600">{trend}</span>}
        </div>
      )}
    </Card>
  );
}
