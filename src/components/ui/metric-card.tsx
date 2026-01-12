import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: {
    value: string | number;
    positive?: boolean;
  };
  icon?: ReactNode;
  className?: string;
}

/**
 * Metric Card - Following skill.md design principles
 * - Monospace for data values
 * - Uppercase tracking-wider labels
 * - Layered shadows (light) / borders (dark)
 * - 4px grid spacing
 */
export function MetricCard({ label, value, delta, icon, className }: MetricCardProps) {
  return (
    <div className={cn("metric-card", className)}>
      <div className="flex items-start justify-between">
        <p className="metric-label">{label}</p>
        {icon && (
          <div className="p-1.5 rounded-md bg-muted">
            {icon}
          </div>
        )}
      </div>
      <p className="metric-value mt-2">{value}</p>
      {delta && (
        <p className={cn(
          "mt-1",
          delta.positive ? "metric-delta-positive" : "metric-delta-negative"
        )}>
          {delta.positive ? "+" : ""}{delta.value}
        </p>
      )}
    </div>
  );
}

interface MetricGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function MetricGrid({ children, columns = 4, className }: MetricGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}
