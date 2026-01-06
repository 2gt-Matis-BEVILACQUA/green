"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import confetti from "canvas-confetti"

interface SuccessAnimationProps {
  message?: string
  onComplete?: () => void
}

export function SuccessAnimation({ message = "Action réussie", onComplete }: SuccessAnimationProps) {
  // Lancer les confettis
  useEffect(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#064e3b", "#10b981", "#34d399"],
    })
    
    const timer = setTimeout(() => {
      onComplete?.()
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="rounded-xl bg-white p-6 shadow-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
        >
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </motion.div>
        <p className="text-center text-sm font-medium text-slate-900">{message}</p>
      </motion.div>
    </motion.div>
  )
}

