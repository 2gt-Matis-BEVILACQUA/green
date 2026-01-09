"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PhotoModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  alt: string
}

export function PhotoModal({ isOpen, onClose, imageUrl, alt }: PhotoModalProps) {
  // Fermer avec la touche Echap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      // Empêcher le scroll du body quand la modale est ouverte
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop avec blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md"
          />

          {/* Modale */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="relative flex items-center justify-center max-h-[90vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bouton de fermeture */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute -top-12 right-0 z-10 h-10 w-10 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Image */}
              <div className="relative flex items-center justify-center" style={{ maxHeight: '85vh', maxWidth: '85vw' }}>
                <img
                  src={imageUrl}
                  alt={alt}
                  className="max-h-[85vh] max-w-[85vw] w-auto h-auto object-contain"
                  style={{ maxHeight: '85vh', maxWidth: '85vw' }}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

