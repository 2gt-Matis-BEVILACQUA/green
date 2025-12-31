"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SegmentControlProps {
  options: Array<{ value: string; label: string }>
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function SegmentControl({
  options,
  value,
  onValueChange,
  className,
}: SegmentControlProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-gray-200 bg-white p-1",
        className
      )}
      role="tablist"
    >
      {options.map((option) => {
        const isSelected = value === option.value
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "relative rounded-md px-4 py-1.5 text-sm font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004225] focus-visible:ring-offset-2",
              isSelected
                ? "bg-[#064e3b] text-white shadow-sm"
                : "text-[#4b5563] hover:text-[#09090b]"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

