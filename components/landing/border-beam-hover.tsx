"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface BorderBeamHoverProps {
  children: ReactNode
  className?: string
}

export function BorderBeamHover({ children, className = "" }: BorderBeamHoverProps) {
  return (
    <motion.div
      className={`group relative overflow-hidden rounded-2xl ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Border Beam Effect */}
      <div className="absolute inset-0 rounded-2xl">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#064e3b]/0 via-[#064e3b]/50 to-[#064e3b]/0 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

