"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CircularGauge } from "./circular-gauge"
import { Sparkline } from "./sparkline"
import { LucideIcon } from "lucide-react"

interface GaugeStatCardProps {
  title: string
  value: number
  max: number
  icon: LucideIcon
  gaugeType?: "circular" | "sparkline"
  sparklineData?: number[]
  color?: string
  description?: string
  className?: string
}

export function GaugeStatCard({
  title,
  value,
  max,
  icon: Icon,
  gaugeType = "circular",
  sparklineData,
  color = "#064e3b",
  description,
  className,
}: GaugeStatCardProps) {
  return (
    <Card className={`border border-slate-200 bg-white shadow-xl ${className || ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-slate-500" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="mb-2 text-3xl font-bold text-[#1E293B]">
              {value}
              <span className="ml-1 text-lg text-slate-600">/ {max}</span>
            </div>
            {description && (
              <p className="text-xs text-slate-600">{description}</p>
            )}
          </div>
          <div>
            {gaugeType === "circular" ? (
              <CircularGauge value={value} max={max} color={color} size={70} />
            ) : sparklineData ? (
              <Sparkline data={sparklineData} color={color} />
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

