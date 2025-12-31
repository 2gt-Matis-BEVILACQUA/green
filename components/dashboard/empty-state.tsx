"use client"

import { CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 px-6"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#004225]/10"
      >
        <CheckCircle2 className="h-8 w-8 text-[#004225]" />
      </motion.div>
      <h3 className="mb-2 text-lg font-semibold text-[#09090b]">
        Tout est en ordre sur le parcours aujourd&apos;hui
      </h3>
      <p className="max-w-md text-center text-sm text-[#4b5563]">
        Aucun incident signalé. Le parcours est en parfait état pour accueillir les joueurs.
      </p>
    </motion.div>
  )
}

