import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Priority } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: fr })
}

// Traduction des priorités
export function translatePriority(priority: Priority): string {
  const translations: Record<Priority, string> = {
    Low: "Basse",
    Medium: "Moyenne",
    High: "Élevée",
    Critical: "Critique",
  }
  return translations[priority] || priority
}

// Traduction des statuts
export function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    Open: "Ouvert",
    In_Progress: "En cours",
    Resolved: "Résolu",
  }
  return translations[status] || status
}
