"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { X, MessageCircle, Calendar, MapPin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Incident } from "@/lib/types"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useDebounce } from "@/hooks/use-debounce"

interface IncidentDrawerProps {
  incident: Incident | null
  isOpen: boolean
  onClose: () => void
  onSaveNote: (incidentId: string, note: string) => void
}

export function IncidentDrawer({ incident, isOpen, onClose, onSaveNote }: IncidentDrawerProps) {
  const [note, setNote] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Mettre à jour la note quand l'incident change
  useEffect(() => {
    if (incident) {
      setNote(incident.internal_note || "")
    }
  }, [incident])

  // Sauvegarde automatique avec debounce
  const debouncedNote = useDebounce(note, 1000)

  useEffect(() => {
    if (incident && debouncedNote !== (incident.internal_note || "")) {
      setIsSaving(true)
      onSaveNote(incident.id, debouncedNote)
      setTimeout(() => setIsSaving(false), 500)
    }
  }, [debouncedNote, incident, onSaveNote])

  if (!incident) return null

  const date = new Date(incident.created_at)
  const formattedDate = format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr })
  const timeStr = format(date, "HH:mm", { locale: fr })

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />

          {/* Slide-over */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 35, stiffness: 400 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl bg-white shadow-2xl"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  Détails de l&apos;incident
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {/* Photo - Pleine largeur */}
                {incident.photo_url && (
                  <div className="mb-6">
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
                      <Image
                        src={incident.photo_url}
                        alt={`Trou ${incident.hole_number}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Incident Info */}
                <div className="mb-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <span className="text-2xl font-bold text-slate-900">
                      Trou {incident.hole_number}
                    </span>
                  </div>

                  {/* Historique */}
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MessageCircle className="h-4 w-4" />
                      <span>Signalé à {timeStr} par WhatsApp</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formattedDate}</span>
                    </div>
                    {incident.reported_by && (
                      <div className="mt-2 text-sm text-slate-600">
                        Expéditeur : {incident.reported_by}
                      </div>
                    )}
                  </div>

                  {incident.description && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium text-slate-600">Description</p>
                      <p className="text-sm text-slate-900 leading-relaxed">{incident.description}</p>
                    </div>
                  )}
                </div>

                {/* Note interne avec sauvegarde auto */}
                <div className="border-t border-slate-200 pt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-900">
                      Note interne du Directeur
                    </label>
                    {isSaving && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Enregistrement...</span>
                      </div>
                    )}
                  </div>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ajoutez une note pour le directeur..."
                    className="min-h-[120px] resize-none border-slate-300 focus:border-[#064e3b] focus:ring-[#064e3b]"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    La note est sauvegardée automatiquement
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
