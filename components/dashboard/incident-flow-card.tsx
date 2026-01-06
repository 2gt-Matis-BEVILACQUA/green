"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Clock } from "lucide-react"
import { Incident } from "@/lib/types"

interface IncidentFlowCardProps {
  incident: Incident
  onClick: () => void
}

export function IncidentFlowCard({ incident, onClick }: IncidentFlowCardProps) {
  const date = new Date(incident.created_at)
  const timeStr = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  const isNew = incident.status === "Open"
  
  // Truncate description to first 60 chars
  const descriptionPreview = incident.description 
    ? incident.description.length > 60 
      ? incident.description.substring(0, 60) + "..." 
      : incident.description
    : "Aucune description"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        {/* Photo thumbnail */}
        {incident.photo_url ? (
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
            <Image
              src={incident.photo_url}
              alt={`Trou ${incident.hole_number}`}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-slate-100 flex items-center justify-center">
            <span className="text-xs text-slate-400">Pas de photo</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-bold text-slate-900">
                  Trou {incident.hole_number}
                </span>
                {isNew ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Nouveau
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    Consulté
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 line-clamp-2">
                {descriptionPreview}
              </p>
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            <span>{timeStr}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

