"use client"

import { motion } from "framer-motion"
import { Activity, Archive, TrendingUp, Zap } from "lucide-react"
import { SpotlightCard } from "./spotlight-card"
import { MacFrame } from "./mac-frame"

const gridItems = [
  {
    id: 1,
    title: "Suivi temps réel",
    description: "Synchronisation instantanée entre terrain et centre de contrôle",
    icon: Activity,
    className: "col-span-1 md:col-span-2",
  },
  {
    id: 2,
    title: "Archives à vie",
    description: "Historique complet de tous les incidents pour analyses",
    icon: Archive,
    className: "col-span-1",
  },
  {
    id: 3,
    title: "Analyses prédictives",
    description: "IA pour anticiper les besoins de maintenance",
    icon: TrendingUp,
    className: "col-span-1 md:col-span-2",
  },
  {
    id: 4,
    title: "Performance optimale",
    description: "Réduction du temps de résolution de 60%",
    icon: Zap,
    className: "col-span-1",
  },
]

export function BentoGrid() {
  return (
    <div className="space-y-8">
      {/* Dashboard Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <MacFrame />
      </motion.div>

      {/* Grid Items */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {gridItems.map((item, index) => {
          const Icon = item.icon
          return (
            <SpotlightCard key={item.id} className={item.className}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="mb-4 inline-flex rounded-lg bg-emerald-500/10 p-3">
                  <Icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-white/60">{item.description}</p>
              </motion.div>
            </SpotlightCard>
          )
        })}
      </div>
    </div>
  )
}
