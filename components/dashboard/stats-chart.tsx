"use client"

import { motion } from "framer-motion"

interface StatsChartProps {
  data: number[]
  label: string
}

export function StatsChart({ data, label }: StatsChartProps) {
  const maxValue = Math.max(...data, 1)

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-[#4b5563]">{label}</div>
      <div className="flex h-32 items-end justify-between gap-1">
        {data.map((value, index) => {
          const height = (value / maxValue) * 100
          return (
            <div key={index} className="flex flex-1 flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                className="w-full rounded-t bg-[#004225]/20"
              />
              <span className="text-[10px] text-[#4b5563]">
                {["L", "M", "M", "J", "V", "S", "D"][index]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

