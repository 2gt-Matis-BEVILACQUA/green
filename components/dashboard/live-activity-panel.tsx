"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock } from "lucide-react"
import { Incident } from "@/lib/types"
import { formatTimeAgo, translatePriority } from "@/lib/utils"
import { motion } from "framer-motion"

interface LiveActivityPanelProps {
  recentIncidents: Incident[]
}

export function LiveActivityPanel({ recentIncidents }: LiveActivityPanelProps) {
  const priorityColors = {
    Low: "bg-gray-100 text-gray-700 border-gray-200",
    Medium: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20",
    High: "bg-[#E0115F]/10 text-[#E0115F] border-[#E0115F]/20",
    Critical: "bg-[#E0115F] text-white border-[#E0115F]",
  }

  return (
    <Card className="h-full border border-slate-200 bg-white shadow-xl">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#064e3b]">
          <Activity className="h-5 w-5 text-[#064e3b]" />
          Activité Live
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {recentIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-2 rounded-full bg-slate-100 p-3">
                <Clock className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-600">Aucune activité récente</p>
            </div>
          ) : (
            recentIncidents.slice(0, 10).map((incident, index) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-lg border border-slate-200 bg-white p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[#1E293B]">
                        Trou {incident.hole_number}
                      </span>
                      <Badge
                        className={`text-xs border ${priorityColors[incident.priority]}`}
                      >
                        {translatePriority(incident.priority)}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{incident.category}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(new Date(incident.created_at))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

