import { IncidentCategory } from "@/lib/types"

/**
 * Mots-clés pour détecter les catégories d'incidents
 */
const categoryKeywords: Record<IncidentCategory, string[]> = {
  Arrosage: ["arrosage", "arrose", "eau", "fuite", "irrigation", "sprinkler", "goutte", "humidité"],
  Tonte: ["tonte", "tondeuse", "herbe", "gazon", "pelouse", "coupe", "tondre", "hauteur"],
  Bunker: ["bunker", "sable", "trap", "fosse", "dune", "sableux"],
  Signaletique: ["signal", "panneau", "indication", "flèche", "direction", "marqueur", "drapeau"],
  Autre: [],
}

/**
 * Extrait le numéro de trou depuis un message
 * Supporte : "Trou 4", "T4", "trou4", "4", etc.
 */
export function extractHoleNumber(message: string): number | null {
  // Patterns: "Trou 4", "T4", "trou4", "t4", "4ème trou", etc.
  const patterns = [
    /trou\s*(\d+)/i,
    /t\s*(\d+)/i,
    /\b(\d+)\s*(?:ème|er|e)?\s*trou/i,
    /\b(\d{1,2})\b/,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      const holeNum = parseInt(match[1], 10)
      if (holeNum >= 1 && holeNum <= 18) {
        return holeNum
      }
    }
  }

  return null
}

/**
 * Détecte la catégorie d'incident depuis le message
 */
export function detectCategory(message: string): IncidentCategory {
  const lowerMessage = message.toLowerCase()

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
      return category as IncidentCategory
    }
  }

  return "Autre"
}

/**
 * Extrait le nom du parcours depuis le message
 * Compare avec les noms de parcours existants
 */
export function extractCourseName(
  message: string,
  availableCourses: Array<{ name: string; id: string }>
): string | null {
  if (!availableCourses || availableCourses.length === 0) {
    return null
  }

  const lowerMessage = message.toLowerCase()

  // Chercher le parcours le plus long qui correspond (pour éviter les faux positifs)
  let bestMatch: { id: string; name: string } | null = null
  let longestMatch = 0

  for (const course of availableCourses) {
    const courseNameLower = course.name.toLowerCase()
    // Vérifie si le nom du parcours est mentionné dans le message
    if (lowerMessage.includes(courseNameLower) && courseNameLower.length > longestMatch) {
      bestMatch = course
      longestMatch = courseNameLower.length
    }
  }

  return bestMatch?.id || null
}

/**
 * Détermine la priorité basée sur des mots-clés
 */
export function detectPriority(message: string): "Low" | "Medium" | "High" | "Critical" {
  const lowerMessage = message.toLowerCase()

  const criticalKeywords = ["urgent", "critique", "grave", "immédiat", "danger"]
  const highKeywords = ["important", "priorité", "rapide", "vite"]
  const lowKeywords = ["mineur", "léger", "petit", "faible"]

  if (criticalKeywords.some((kw) => lowerMessage.includes(kw))) {
    return "Critical"
  }
  if (highKeywords.some((kw) => lowerMessage.includes(kw))) {
    return "High"
  }
  if (lowKeywords.some((kw) => lowerMessage.includes(kw))) {
    return "Low"
  }

  return "Medium"
}

