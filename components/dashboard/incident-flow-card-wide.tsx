"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Clock } from "lucide-react"
import { Incident } from "@/lib/types"
import { formatTimeAgo } from "@/lib/utils"
import { IncidentActionMenu } from "./incident-action-menu"
import { PriorityBadge } from "./priority-badge"
import { PhotoModal } from "./photo-modal"

interface IncidentFlowCardWideProps {
  incident: Incident
  onClick: () => void
  onTreat?: () => void
  onArchive?: () => void
  onUrgent?: () => void
  courseName?: string
}

export function IncidentFlowCardWide({
  incident,
  onClick,
  onTreat,
  onArchive,
  onUrgent,
  courseName,
}: IncidentFlowCardWideProps) {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  // const isNew = incident.status === "Open"
  // const statusColor = isNew ? "bg-red-500" : "bg-amber-500"

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher l'ouverture du drawer
    if (incident.photo_url) {
      setIsPhotoModalOpen(true)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
        className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-xl"
      >
        <div className="flex items-center gap-4">
          {/* Photo - Left */}
          {incident.photo_url ? (
            <div
              onClick={handlePhotoClick}
              className="relative h-[120px] w-[120px] flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 cursor-zoom-in transition-transform duration-200 hover:scale-105"
            >
              <Image
                src={incident.photo_url}
                alt={`Trou ${incident.hole_number}`}
                fill
                className="object-cover"
                sizes="120px"
                loading="lazy"
              />
            </div>
          ) : null}

        {/* Content - Center */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            {courseName && (
              <span className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
                {courseName}
              </span>
            )}
            <span className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-1.5 text-lg font-bold text-white">
              Trou {incident.hole_number}
            </span>
            <PriorityBadge priority={incident.priority} />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {incident.category}
            </span>
          </div>
          {incident.description && (
            <p className="text-sm text-slate-700 line-clamp-2">
              {incident.description}
            </p>
          )}
        </div>

        {/* Time, Status & Actions - Right */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTimeAgo(new Date(incident.created_at))}</span>
            </div>
            <IncidentActionMenu
              onTreat={onTreat || (() => {})}
              onArchive={onArchive || (() => {})}
              onUrgent={onUrgent || (() => {})}
            />
          </div>
          {/* Pastille de statut - Temporairement désactivée */}
          {/* <div className={`h-3 w-3 rounded-full ${statusColor}`}></div> */}
        </div>
      </div>
    </motion.div>

    {/* Modale photo full-screen */}
    {incident.photo_url && (
      <PhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        imageUrl={incident.photo_url}
        alt={`Photo du trou ${incident.hole_number}`}
      />
    )}
    </>
  )
}
