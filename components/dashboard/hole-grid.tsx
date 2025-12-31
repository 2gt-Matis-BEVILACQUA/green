"use client"

import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Incident } from "@/lib/types"
import { cn } from "@/lib/utils"

interface HoleGridProps {
  holes: Array<{ number: number; incident?: Incident }>
  maxHoles?: number
  onHoleClick?: (holeNumber: number) => void
}

export function HoleGrid({ holes, maxHoles, onHoleClick }: HoleGridProps) {
  const displayHoles = maxHoles ? holes.slice(0, maxHoles) : holes
  const getHoleStatus = (incident?: Incident) => {
    if (!incident || incident.status === "Resolved") return "normal"
    if (incident.priority === "Critical" || incident.priority === "High") return "urgent"
    return "warning"
  }

  return (
    <div className={`grid gap-3 ${maxHoles && maxHoles <= 9 ? 'grid-cols-3 md:grid-cols-9' : 'grid-cols-6 md:grid-cols-9 lg:grid-cols-9'}`}>
      {displayHoles.map((hole, index) => {
        const status = getHoleStatus(hole.incident)
        
        return (
          <motion.div
            key={hole.number}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
          >
            <Card
              className={cn(
                "glass group relative cursor-pointer border shadow-sm transition-all hover:shadow-md",
                status === "normal" && "border-gray-200/50",
                status === "warning" && "border-[#D4AF37] shadow-[#D4AF37]/20 ring-2 ring-[#D4AF37]/20",
                status === "urgent" && "border-[#E0115F] shadow-[#E0115F]/20 ring-2 ring-[#E0115F]/20"
              )}
              onClick={() => onHoleClick?.(hole.number)}
            >
              <div className="flex flex-col items-center justify-center p-4">
                <div className={cn(
                  "mb-2 text-2xl font-serif font-bold",
                  status === "normal" && "text-[#4b5563]",
                  status === "warning" && "text-[#D4AF37]",
                  status === "urgent" && "text-[#E0115F]"
                )}>
                  {hole.number}
                </div>
                {hole.incident && (
                  <div className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

