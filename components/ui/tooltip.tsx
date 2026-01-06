"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  children: React.ReactNode
  content: string
  side?: "top" | "bottom" | "left" | "right"
}

export function Tooltip({ children, content, side = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 rounded-lg bg-slate-900 px-2 py-1 text-xs text-white shadow-lg whitespace-nowrap",
            sideClasses[side]
          )}
        >
          {content}
          <div
            className={cn(
              "absolute h-0 w-0 border-4 border-transparent",
              side === "top" && "top-full left-1/2 -translate-x-1/2 border-t-slate-900",
              side === "bottom" && "bottom-full left-1/2 -translate-x-1/2 border-b-slate-900",
              side === "left" && "left-full top-1/2 -translate-y-1/2 border-l-slate-900",
              side === "right" && "right-full top-1/2 -translate-y-1/2 border-r-slate-900"
            )}
          />
        </div>
      )}
    </div>
  )
}

