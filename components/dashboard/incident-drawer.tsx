"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { X, MessageCircle, Calendar, MapPin, Loader2, Upload, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Incident } from "@/lib/types"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { PhotoModal } from "./photo-modal"

interface IncidentDrawerProps {
  incident: Incident | null
  isOpen: boolean
  onClose: () => void
  onSaveNote: (incidentId: string, note: string) => void
  onPhotoUploaded?: () => void
}

export function IncidentDrawer({ incident, isOpen, onClose, onSaveNote, onPhotoUploaded }: IncidentDrawerProps) {
  const [note, setNote] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastSavedNoteRef = useRef<string>("")
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Mettre à jour la note quand l'incident change
  useEffect(() => {
    if (incident) {
      const incidentNote = incident.internal_note || ""
      setNote(incidentNote)
      lastSavedNoteRef.current = incidentNote
      // Réinitialiser la prévisualisation si l'incident change
      setImagePreview(null)
    }
  }, [incident?.id, incident?.internal_note])

  // Gérer la sélection d'image
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Upload de l'image
  const handleImageUpload = async () => {
    if (!incident || !fileInputRef.current?.files?.[0]) return

    const file = fileInputRef.current.files[0]
    setIsUploadingPhoto(true)

    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch(`/api/incidents/${incident.id}/upload-photo`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de l'upload")
      }

      const data = await response.json()
      
      // Réinitialiser le preview et l'input
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Notifier le parent pour rafraîchir les données
      if (onPhotoUploaded) {
        onPhotoUploaded()
      }

      // Attendre un peu pour que la base de données se mette à jour
      setTimeout(() => {
        if (onPhotoUploaded) {
          onPhotoUploaded()
        }
      }, 500)
    } catch (error) {
      console.error("Error uploading image:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de l'upload de l'image")
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // Sauvegarde automatique avec debounce (uniquement si la note a changé)
  useEffect(() => {
    // Nettoyer le timeout précédent
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Ne sauvegarder que si la note est différente de celle déjà sauvegardée
    if (
      incident &&
      note !== lastSavedNoteRef.current &&
      note !== (incident.internal_note || "")
    ) {
      setIsSaving(true)
      
      saveTimeoutRef.current = setTimeout(async () => {
        if (!isSubmitting) {
          setIsSubmitting(true)
          try {
            await onSaveNote(incident.id, note)
            lastSavedNoteRef.current = note
          } finally {
            setIsSubmitting(false)
            setIsSaving(false)
          }
        }
      }, 1000)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [note, incident, onSaveNote, isSubmitting])

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
                {/* Zone d'upload / Photo - Pleine largeur avec zoom */}
                <div className="mb-6">
                  {incident.photo_url || imagePreview ? (
                    <div
                      onClick={() => {
                        if (incident.photo_url) {
                          setIsPhotoModalOpen(true)
                        }
                      }}
                      className={`relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 transition-transform duration-200 ${
                        incident.photo_url ? "cursor-zoom-in hover:scale-[1.02]" : ""
                      }`}
                    >
                      <Image
                        src={imagePreview || incident.photo_url || ""}
                        alt={`Trou ${incident.hole_number}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 672px"
                        loading="lazy"
                      />
                      {imagePreview && !incident.photo_url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="text-center text-white">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
                            <p className="text-sm">Traitement de l'image...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
                      <div className="flex h-full flex-col items-center justify-center p-6">
                        <ImageIcon className="h-12 w-12 text-slate-400 mb-3" />
                        <p className="mb-2 text-sm font-medium text-slate-600">
                          Aucune photo disponible
                        </p>
                        <p className="mb-4 text-xs text-slate-500 text-center">
                          Ajoutez une photo si le jardinier a oublié de la prendre
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Zone d'upload */}
                  <div className="mt-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    {imagePreview && (
                      <div className="mb-3 flex items-center gap-3">
                        <Button
                          onClick={handleImageUpload}
                          disabled={isUploadingPhoto}
                          className="flex items-center gap-2 bg-[#064e3b] text-white hover:bg-[#064e3b]/90"
                        >
                          {isUploadingPhoto ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Upload en cours...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Enregistrer la photo
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setImagePreview(null)
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ""
                            }
                          }}
                          disabled={isUploadingPhoto}
                        >
                          Annuler
                        </Button>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2"
                      disabled={isUploadingPhoto || !!imagePreview}
                    >
                      <Upload className="h-4 w-4" />
                      {incident.photo_url ? "Remplacer la photo" : "Ajouter une photo"}
                    </Button>
                  </div>
                </div>

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
      )}
    </AnimatePresence>
  )
}
