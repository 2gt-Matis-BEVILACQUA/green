"use client"

import { motion } from "framer-motion"
import { Incident } from "@/lib/types"

interface HoleStatusGridProps {
  totalHoles: number
  incidents: Incident[]
  onHoleClick?: (holeNumber: number) => void
}

export function HoleStatusGrid({
  totalHoles,
  incidents,
  onHoleClick,
}: HoleStatusGridProps) {
  const holesWithIncidents = new Set(
    incidents
      .filter((inc) => inc.status !== "Resolved")
      .map((inc) => inc.hole_number)
  )

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">
        État du Parcours (1-{totalHoles})
      </h3>
      <div className="grid grid-cols-9 gap-2">
        {Array.from({ length: totalHoles }, (_, i) => {
          const holeNumber = i + 1
          const hasIncident = holesWithIncidents.has(holeNumber)

          return (
            <motion.button
              key={holeNumber}
              onClick={() => onHoleClick?.(holeNumber)}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium transition-all ${
                hasIncident
                  ? "bg-red-500 text-white shadow-lg"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {holeNumber}
              {hasIncident && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-red-500"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 0, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-slate-100"></div>
          <span>Conforme</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500"></div>
          <span>Incident</span>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500 italic">
        Cliquez sur un trou pour voir son historique spécifique
      </p>
    </div>
  )
}

