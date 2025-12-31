"use client"

import { Trophy } from "lucide-react"
import { motion } from "framer-motion"

interface TrophyEmptyStateProps {
  courseName?: string
}

export function TrophyEmptyState({ courseName }: TrophyEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-xl border border-gray-200/50 bg-white/70 backdrop-blur-md py-20 px-6 shadow-lg"
    >
      <motion.div
        initial={{ scale: 0.8, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#064e3b]/10 to-[#D4AF37]/10"
      >
        <Trophy className="h-12 w-12 text-[#D4AF37]" />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-3 text-2xl font-semibold text-[#000000]"
      >
        {courseName ? `Parcours ${courseName} impeccable` : "Parcours impeccable"}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-md text-center text-sm text-[#4b5563]"
      >
        Aucun incident signalé. Le parcours est en parfait état pour accueillir les joueurs.
      </motion.p>
    </motion.div>
  )
}

