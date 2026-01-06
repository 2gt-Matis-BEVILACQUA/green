"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MoreVertical, CheckCircle2, Archive, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip } from "@/components/ui/tooltip"

interface IncidentActionMenuProps {
  onTreat: () => void
  onArchive: () => void
  onUrgent: () => void
}

export function IncidentActionMenu({ onTreat, onArchive, onUrgent }: IncidentActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <Tooltip content="Actions rapides" side="left">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </Tooltip>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-8 z-50 w-48 rounded-lg border border-slate-200 bg-white shadow-xl py-1"
            >
              <Tooltip content="Marquer comme résolu" side="left">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onTreat()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-200"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Traiter
                </button>
              </Tooltip>
              <Tooltip content="Marquer comme urgent" side="left">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUrgent()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-200"
                >
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Urgent
                </button>
              </Tooltip>
              <Tooltip content="Archiver l'incident" side="left">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onArchive()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-200"
                >
                  <Archive className="h-4 w-4 text-slate-500" />
                  Archiver
                </button>
              </Tooltip>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

