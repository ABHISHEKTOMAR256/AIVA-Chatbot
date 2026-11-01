interface ProgressBarProps {
  current: number;
  target?: number;
  label?: string;
}

export function ProgressBar({
  current,
  target = 25,
  label = "25 Genuine Conversations Requirement",
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  const remaining = Math.max(target - current, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
          {label}
        </span>
        <span className="text-sm font-bold text-indigo-600">
          {current} / {target} ({percentage}%)
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percentage >= 100
              ? "bg-emerald-500"
              : percentage >= 50
              ? "bg-indigo-600"
              : "bg-amber-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          {remaining === 0 ? (
            <span className="text-emerald-600 font-semibold">
              🎉 Requirement Achieved! Live evaluation criteria satisfied.
            </span>
          ) : (
            <span>{remaining} more genuine user conversations required.</span>
          )}
        </span>
        <span className="text-[11px] text-gray-400">
          *Counts real users with ≥2 messages
        </span>
      </div>
    </div>
  );
}
