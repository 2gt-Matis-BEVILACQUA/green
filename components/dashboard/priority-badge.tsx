"use client"

import { Priority } from "@/lib/types"
import { cn } from "@/lib/utils"

interface PriorityBadgeProps {
  priority: Priority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const styles = {
    Critical: "bg-red-100 text-red-700 border-red-200",
    High: "bg-orange-100 text-orange-700 border-orange-200",
    Medium: "bg-blue-100 text-blue-700 border-blue-200",
    Low: "bg-slate-100 text-slate-700 border-slate-200",
  }

  const labels = {
    Critical: "Critique",
    High: "Standard",
    Medium: "Amélioration",
    Low: "Basse",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[priority],
        className
      )}
    >
      {labels[priority]}
    </span>
  )
}

