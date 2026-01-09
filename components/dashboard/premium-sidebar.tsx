"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BarChart3, Map, Settings, LogOut, User, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Tableau de bord", href: "/", icon: Activity },
  { name: "Archives", href: "/history", icon: BarChart3 },
  { name: "Gestion des Parcours", href: "/settings?tab=courses", icon: Map },
  { name: "Paramètres", href: "/settings", icon: Settings },
]

interface PremiumSidebarProps {
  newIncidentsCount?: number
  onExportClick?: () => void
}

export function PremiumSidebar({ newIncidentsCount = 0, onExportClick }: PremiumSidebarProps) {
  const pathname = usePathname()

  return (
    <div className="fixed left-0 top-0 z-40 hidden lg:flex h-screen w-64 flex-col border-r border-slate-800/50 bg-[#0F172A]">
      {/* Logo Section - Agrandi avec espacement généreux */}
      <div className="flex items-center justify-center border-b border-slate-800/50 w-full bg-white/5 backdrop-blur-sm py-8 px-6">
        <Link href="/" className="flex items-center justify-center w-full transition-all duration-200 hover:scale-105">
          <img
            src="/logo.png"
            alt="TerrainSync"
            className="w-full max-w-[180px] h-auto object-contain brightness-110 drop-shadow-sm"
            style={{ aspectRatio: "auto" }}
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
        {/* Bouton Export */}
        {onExportClick && (
          <button
            onClick={onExportClick}
            className="group relative flex w-full items-center gap-3 rounded-lg bg-[#064e3b] px-3 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#064e3b]/90 shadow-lg"
          >
            <FileText className="h-5 w-5 stroke-[1.5]" />
            <span className="flex-1 text-left">Exporter / Rapport</span>
          </button>
        )}
        
        {navigation.map((item) => {
          const isActive = 
            pathname === item.href || 
            (item.href === "/settings" && pathname?.startsWith("/settings")) ||
            (item.href === "/settings?tab=courses" && pathname?.startsWith("/settings"))
          const showBadge = item.name === "Tableau de bord" && newIncidentsCount > 0

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-slate-800 text-white font-semibold shadow-lg shadow-slate-900/20"
                  : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
              )}
            >
              {/* Bordure gauche colorée pour l'actif */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-0.5 bg-[#064e3b] rounded-r-full" />
              )}
              <item.icon className="h-5 w-5 stroke-[1.5]" />
              <span className="flex-1">{item.name}</span>
              {showBadge && (
                <span className="flex h-2 w-2 items-center justify-center">
                  <span className="absolute flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                  </span>
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer - Profil */}
      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
            <User className="h-5 w-5 text-slate-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Matis Bevilacqua</p>
            <p className="text-xs text-slate-400 truncate">Directeur</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  )
}
