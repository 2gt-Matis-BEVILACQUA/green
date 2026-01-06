"use client"

import { motion } from "framer-motion"
import Image from "next/image"

interface MacFrameProps {
  children?: React.ReactNode
  screenshot?: string
}

export function MacFrame({ children, screenshot }: MacFrameProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative mx-auto w-full max-w-5xl"
    >
      {/* Mac Frame */}
      <div className="relative rounded-lg bg-[#09090b] border border-white/10 p-2 shadow-2xl">
        {/* Top Bar */}
        <div className="flex items-center gap-2 rounded-t-lg bg-[#09090b] border-b border-white/10 px-4 py-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff5f56]"></div>
            <div className="h-3 w-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="h-3 w-3 rounded-full bg-[#27c93f]"></div>
          </div>
          <div className="flex-1 text-center">
            <div className="mx-auto w-64 rounded bg-[#000000] px-3 py-1 text-xs text-white/60">
              terrain-sync.local
            </div>
          </div>
        </div>

        {/* Screen Content */}
        <div className="relative overflow-hidden rounded-b-lg bg-[#000000] border border-white/5">
          {screenshot ? (
            <div className="relative aspect-video w-full">
              <Image
                src={screenshot}
                alt="Dashboard Preview"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="relative aspect-video w-full bg-[#09090b] flex items-center justify-center">
              <div className="text-center">
                <div className="mb-4 text-4xl">📊</div>
                <p className="text-sm text-white/40">Screenshot du Dashboard</p>
                <p className="mt-2 text-xs text-white/20">Ajoutez votre capture d'écran ici</p>
              </div>
            </div>
          )}
          {children}
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 blur-2xl"></div>
    </motion.div>
  )
}

