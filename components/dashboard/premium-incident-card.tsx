"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Droplets, Scissors, Flag, AlertCircle, Clock, ChevronRight, Sprout } from "lucide-react"
import Image from "next/image"
import { formatTimeAgo, translatePriority } from "@/lib/utils"
import { IncidentCategory, Priority } from "@/lib/types"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PremiumIncidentCardProps {
  id: string
  holeNumber: number
  category: IncidentCategory
  description?: string | null
  photoUrl?: string | null
  priority: Priority
  createdAt: Date
  onViewDetails: () => void
}

const categoryIcons = {
  Arrosage: Droplets, // Goutte
  Tonte: Scissors, // Tondeuse
  Bunker: Flag, // Sable (représenté par drapeau)
  Signaletique: AlertCircle, // Drapeau pour signalétique
  Autre: AlertCircle,
}

const priorityColors = {
  Low: "bg-gray-100 text-gray-700 border-gray-200",
  Medium: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20",
  High: "bg-[#E0115F]/10 text-[#E0115F] border-[#E0115F]/20",
  Critical: "bg-[#E0115F] text-white border-[#E0115F]",
}

export function PremiumIncidentCard({
  holeNumber,
  category,
  description,
  photoUrl,
  priority,
  createdAt,
  onViewDetails,
}: PremiumIncidentCardProps) {
  const Icon = categoryIcons[category] || AlertCircle

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "group overflow-hidden border border-slate-200 bg-white shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02] rounded-lg",
        (priority === "High" || priority === "Critical") && "border-t-2 border-t-[#064e3b]"
      )}>
        <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
          {photoUrl ? (
            <>
              <Image
                src={photoUrl}
                alt={`Incident trou ${holeNumber}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                quality={85}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <Icon className="h-12 w-12 text-gray-300" />
            </div>
          )}
          
          {/* Badge flottant sur l'image */}
          <div className="absolute left-3 top-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#064e3b] text-sm font-serif font-bold text-white shadow-lg">
              {holeNumber}
            </div>
          </div>

          {/* Badge priorité en haut à droite */}
          <div className="absolute right-3 top-3">
            <Badge
              className={cn(
                "border text-xs font-medium",
                priorityColors[priority]
              )}
            >
              {translatePriority(priority)}
            </Badge>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-[#1E293B]">{category}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(createdAt)}
            </div>
          </div>

          {description && (
            <p className="mb-4 line-clamp-2 text-sm text-slate-600">
              {description}
            </p>
          )}

          <Button
            size="sm"
            onClick={onViewDetails}
            className="w-full bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-800 hover:to-emerald-700 border border-emerald-900/20 shadow-md"
          >
            Détails
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

