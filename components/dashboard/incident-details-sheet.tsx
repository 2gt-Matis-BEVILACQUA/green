"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Droplets, Scissors, Flag, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import Image from "next/image"
import { formatTimeAgo, translatePriority, translateStatus } from "@/lib/utils"
import { IncidentCategory, Priority, Incident } from "@/lib/types"
import { cn } from "@/lib/utils"

interface IncidentDetailsSheetProps {
  incident: Incident | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onResolve?: (id: string) => void
}

const categoryIcons = {
  Arrosage: Droplets,
  Tonte: Scissors,
  Bunker: Flag,
  Signaletique: AlertCircle,
  Autre: AlertCircle,
}

const priorityColors = {
  Low: "bg-gray-100 text-gray-700 border-gray-200",
  Medium: "bg-blue-50 text-blue-700 border-blue-200",
  High: "bg-cherry/10 text-cherry border-cherry/20",
  Critical: "bg-cherry text-white border-cherry",
}

export function IncidentDetailsSheet({
  incident,
  open,
  onOpenChange,
  onResolve,
}: IncidentDetailsSheetProps) {
  if (!incident) return null

  const Icon = categoryIcons[incident.category] || AlertCircle

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#064e3b] text-lg font-serif font-bold text-white">
              T{incident.hole_number.toString().padStart(2, "0")}
            </div>
            <div>
              <SheetTitle className="text-left text-[#0F172A]">Incident - Trou {incident.hole_number}</SheetTitle>
              <SheetDescription className="text-left flex items-center gap-2 mt-1 text-[#475569]">
                <Icon className="h-4 w-4" />
                {incident.category}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Photo */}
          {incident.photo_url && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              <Image
                src={incident.photo_url}
                alt={`Incident trou ${incident.hole_number}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 512px"
                priority
                quality={90}
              />
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge
              className={cn("border", priorityColors[incident.priority])}
            >
              {translatePriority(incident.priority)}
            </Badge>
            <Badge variant="outline" className="border-slate-200">
              {translateStatus(incident.status)}
            </Badge>
            {incident.reported_by && (
              <Badge variant="outline" className="border-slate-200">
                Signalé par {incident.reported_by}
              </Badge>
            )}
          </div>

          {/* Description */}
          {incident.description && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-[#1E293B]">Description</h4>
              <p className="text-sm text-slate-600">{incident.description}</p>
            </div>
          )}

          {/* Détails temporels */}
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">Signalé :</span>
              <span className="font-medium text-[#1E293B]">{formatTimeAgo(new Date(incident.created_at))}</span>
            </div>
            <div className="text-xs text-slate-500">
              {new Date(incident.created_at).toLocaleString("fr-FR", {
                dateStyle: "full",
                timeStyle: "short",
              })}
            </div>
          </div>

          {/* Action */}
          {incident.status !== "Resolved" && onResolve && (
            <Button
              onClick={() => onResolve(incident.id)}
              className="w-full bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-800 hover:to-emerald-700 border border-emerald-900/20 shadow-md"
              size="lg"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Marquer comme résolu
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

