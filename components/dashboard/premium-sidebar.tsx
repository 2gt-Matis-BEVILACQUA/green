"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BarChart3, Map, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Tableau de bord", href: "/", icon: Activity },
  { name: "Archives", href: "/history", icon: BarChart3 },
  { name: "Gestion des Parcours", href: "/settings?tab=courses", icon: Map },
  { name: "Paramètres", href: "/settings", icon: Settings },
]

export function PremiumSidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed left-0 top-0 z-40 hidden lg:flex h-screen w-64 flex-col border-r border-slate-800/50 bg-[#0F172A]">
      <div className="flex h-16 items-center border-b border-slate-800/50 px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#064e3b]">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">GreenLog OS</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href === "/settings" && pathname?.startsWith("/settings"))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#064e3b] text-white font-semibold shadow-lg"
                  : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 stroke-[1.5]" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

