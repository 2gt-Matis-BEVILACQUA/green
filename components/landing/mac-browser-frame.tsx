"use client"

import Image from "next/image"
import { motion } from "framer-motion"

export function MacBrowserFrame() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative mx-auto w-full max-w-5xl"
    >
      {/* Mac Browser Frame */}
      <div className="relative rounded-lg bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center gap-2 bg-white/5 border-b border-white/10 px-4 py-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff5f56]"></div>
            <div className="h-3 w-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="h-3 w-3 rounded-full bg-[#27c93f]"></div>
          </div>
          <div className="flex-1 text-center">
            <div className="mx-auto w-64 rounded bg-white/5 px-3 py-1 text-xs text-white/60 border border-white/10">
              terrain-sync.local
            </div>
          </div>
        </div>

        {/* Screen Content */}
        <div className="relative aspect-video w-full bg-gradient-to-br from-slate-950 to-black overflow-hidden">
          <Image
            src="/dashboard_mockup.png"
            alt="Dashboard Preview"
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = "none"
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = '<div class="flex h-full items-center justify-center"><p class="text-sm text-white/40">Dashboard Screenshot</p></div>'
              }
            }}
          />
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-[#064e3b]/10 via-transparent to-[#064e3b]/10 blur-2xl"></div>
    </motion.div>
  )
}

