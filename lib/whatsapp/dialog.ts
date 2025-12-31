import { createClient } from "@/lib/supabase/server"
import { ChatSession, ChatState, ChatSessionUpdate } from "./session"
import {
  extractHoleNumber,
  detectCategory,
  extractCourseName,
  detectPriority,
} from "./parser"
import { IncidentCategory } from "@/lib/types"

/**
 * Gère le flux conversationnel du chatbot
 */
export class WhatsAppDialog {
  private session: ChatSession
  private message: string
  private mediaUrl: string | null

  constructor(session: ChatSession, message: string, mediaUrl: string | null = null) {
    this.session = session
    this.message = message.trim()
    this.mediaUrl = mediaUrl
  }

  /**
   * Traite le message selon l'état actuel de la session
   */
  async process(): Promise<{ response: string; shouldUpdate: boolean; updates?: ChatSessionUpdate }> {
    const lowerMessage = this.message.toLowerCase()

    // Détection de commandes spéciales et messages de démarrage
    const startKeywords = ["hello", "bonjour", "salut", "hi", "start", "démarrer", "commencer"]
    if (startKeywords.includes(lowerMessage) || lowerMessage === "reset" || lowerMessage === "annuler" || lowerMessage === "recommencer") {
      return {
        response: "🔄 Session réinitialisée. Sur quel parcours es-tu ?",
        shouldUpdate: true,
        updates: {
          state: "AWAITING_COURSE",
          course_id: null,
          hole_number: null,
          description: null,
          category: null,
          photo_url: null,
        },
      }
    }

    // Parsing intelligent : si le message contient toutes les infos, on peut sauter des étapes
    const hasAllInfo = await this.tryParseCompleteMessage()
    if (hasAllInfo) {
      return hasAllInfo
    }

    // Traitement selon l'état
    switch (this.session.state) {
      case "AWAITING_COURSE":
        return await this.handleCourseSelection()

      case "AWAITING_HOLE":
        return await this.handleHoleSelection()

      case "AWAITING_DESCRIPTION":
        return await this.handleDescription()

      case "AWAITING_PHOTO":
        return await this.handlePhoto()

      case "COMPLETED":
        return {
          response: "✅ Votre signalement a déjà été enregistré. Tapez 'reset' pour en créer un nouveau.",
          shouldUpdate: false,
        }

      default:
        return {
          response: "❌ État de session invalide. Tapez 'reset' pour recommencer.",
          shouldUpdate: false,
        }
    }
  }

  /**
   * Tente de parser un message complet (ex: "Trou 4 sur L'Océan, fuite d'eau")
   */
  private async tryParseCompleteMessage(): Promise<
    { response: string; shouldUpdate: boolean; updates?: ChatSessionUpdate } | null
  > {
    const supabase = await createClient()

    // Récupérer les parcours
    const { data: courses } = await supabase
      .from("courses")
      .select("id, name, hole_count")
      .eq("club_id", this.session.club_id)
      .eq("is_active", true)

    if (!courses || courses.length === 0) {
      return null
    }

    // Extraire le trou
    const holeNumber = extractHoleNumber(this.message)
    if (!holeNumber) {
      return null
    }

    // Extraire le parcours
    const courseId = extractCourseName(this.message, courses) || courses[0].id
    const selectedCourse = courses.find((c) => c.id === courseId)

    if (!selectedCourse) {
      return null
    }

    // Vérifier que le trou est valide
    if (holeNumber > selectedCourse.hole_count) {
      return {
        response: `❌ Le parcours "${selectedCourse.name}" n'a que ${selectedCourse.hole_count} trous. Quel est le bon numéro ?`,
        shouldUpdate: true,
        updates: {
          state: "AWAITING_HOLE",
          course_id: courseId,
        },
      }
    }

    // Détecter la catégorie
    const category = detectCategory(this.message)
    const priority = detectPriority(this.message)

    // Si on a une photo, on peut compléter directement
    if (this.mediaUrl) {
      return {
        response: "✅ Informations complètes reçues ! Enregistrement en cours...",
        shouldUpdate: true,
        updates: {
          state: "AWAITING_PHOTO",
          course_id: courseId,
          hole_number: holeNumber,
          description: this.message,
          category,
          priority,
          photo_url: this.mediaUrl,
        },
      }
    }

    // Sinon, on a besoin de la photo
    return {
      response: `✅ Parcours "${selectedCourse.name}", Trou ${holeNumber} détecté.\n\n📸 Envoie une photo de l'incident, ou tape "Fini" pour continuer sans photo.`,
      shouldUpdate: true,
      updates: {
        state: "AWAITING_PHOTO",
        course_id: courseId,
        hole_number: holeNumber,
        description: this.message,
        category,
        priority,
      },
    }
  }

  /**
   * Gère la sélection du parcours
   */
  private async handleCourseSelection(): Promise<{
    response: string
    shouldUpdate: boolean
    updates?: ChatSessionUpdate
  }> {
    const supabase = await createClient()

    const { data: courses } = await supabase
      .from("courses")
      .select("id, name")
      .eq("club_id", this.session.club_id)
      .eq("is_active", true)
      .order("name")

    if (!courses || courses.length === 0) {
      return {
        response: "❌ Aucun parcours configuré pour ce club.",
        shouldUpdate: false,
      }
    }

    // Vérifier si le message contient un numéro (sélection par numéro)
    const numberMatch = this.message.match(/^(\d+)$/)
    if (numberMatch) {
      const selectedIndex = parseInt(numberMatch[1], 10) - 1
      if (selectedIndex >= 0 && selectedIndex < courses.length) {
        const selectedCourse = courses[selectedIndex]
        return {
          response: `✅ Parcours "${selectedCourse.name}" sélectionné.\n\nQuel numéro de trou ?`,
          shouldUpdate: true,
          updates: {
            state: "AWAITING_HOLE",
            course_id: selectedCourse.id,
          },
        }
      }
    }

    // Vérifier si le message contient le nom d'un parcours
    const courseId = extractCourseName(this.message, courses)
    if (courseId) {
      const selectedCourse = courses.find((c) => c.id === courseId)
      return {
        response: `✅ Parcours "${selectedCourse?.name}" sélectionné.\n\nQuel numéro de trou ?`,
        shouldUpdate: true,
        updates: {
          state: "AWAITING_HOLE",
          course_id: courseId,
        },
      }
    }

    // Afficher la liste des parcours
    const courseList = courses
      .map((course, index) => `${index + 1}. ${course.name}`)
      .join("\n")

    return {
      response: `Bonjour ! Sur quel parcours es-tu ?\n\n${courseList}\n\nRéponds par le numéro ou le nom du parcours.`,
      shouldUpdate: false,
    }
  }

  /**
   * Gère la sélection du trou
   */
  private async handleHoleSelection(): Promise<{
    response: string
    shouldUpdate: boolean
    updates?: ChatSessionUpdate
  }> {
    if (!this.session.course_id) {
      return {
        response: "❌ Erreur : parcours non sélectionné. Tapez 'reset' pour recommencer.",
        shouldUpdate: false,
      }
    }

    const supabase = await createClient()

    // Récupérer les détails du parcours
    const { data: course } = await supabase
      .from("courses")
      .select("name, hole_count")
      .eq("id", this.session.course_id)
      .single()

    if (!course) {
      return {
        response: "❌ Parcours introuvable. Tapez 'reset' pour recommencer.",
        shouldUpdate: false,
      }
    }

    // Extraire le numéro de trou
    const holeNumber = extractHoleNumber(this.message)

    if (!holeNumber) {
      return {
        response: `❌ Je n'ai pas compris le numéro de trou. Veuillez indiquer un nombre entre 1 et ${course.hole_count}.\n\nExemple : "4" ou "Trou 4"`,
        shouldUpdate: false,
      }
    }

    // Valider le numéro de trou
    if (holeNumber < 1 || holeNumber > course.hole_count) {
      return {
        response: `❌ Le parcours "${course.name}" n'a que ${course.hole_count} trous. Veuillez indiquer un numéro entre 1 et ${course.hole_count}.`,
        shouldUpdate: false,
      }
    }

    return {
      response: `✅ Trou ${holeNumber} sélectionné.\n\nDécris-moi le problème en quelques mots.`,
      shouldUpdate: true,
      updates: {
        state: "AWAITING_DESCRIPTION",
        hole_number: holeNumber,
      },
    }
  }

  /**
   * Gère la description
   */
  private async handleDescription(): Promise<{
    response: string
    shouldUpdate: boolean
    updates?: ChatSessionUpdate
  }> {
    if (this.message.length < 3) {
      return {
        response: "❌ La description est trop courte. Veuillez décrire le problème en quelques mots.",
        shouldUpdate: false,
      }
    }

    const category = detectCategory(this.message)
    const priority = detectPriority(this.message)

    return {
      response: `✅ Description enregistrée.\n\n📸 Envoie une photo de l'incident si possible, ou tape "Fini" pour continuer sans photo.`,
      shouldUpdate: true,
      updates: {
        state: "AWAITING_PHOTO",
        description: this.message,
        category,
        priority,
      },
    }
  }

  /**
   * Gère la photo
   */
  private async handlePhoto(): Promise<{
    response: string
    shouldUpdate: boolean
    updates?: ChatSessionUpdate
  }> {
    const lowerMessage = this.message.toLowerCase()

    // Si l'utilisateur dit "Fini" ou "Terminé", on continue sans photo
    if (lowerMessage === "fini" || lowerMessage === "terminé" || lowerMessage === "pas de photo") {
      return {
        response: "✅ Signalement enregistré et visible sur le Dashboard. Merci !",
        shouldUpdate: true,
        updates: {
          state: "COMPLETED",
        },
      }
    }

    // Si une photo est fournie, on la stocke temporairement (URL Twilio)
    // Elle sera uploadée vers Supabase lors de la finalisation
    if (this.mediaUrl) {
      return {
        response: "✅ Photo reçue ! Enregistrement en cours...",
        shouldUpdate: true,
        updates: {
          state: "COMPLETED",
          photo_url: this.mediaUrl, // URL Twilio temporaire, sera uploadée lors de la finalisation
        },
      }
    }

    // Sinon, demander la photo
    return {
      response: '📸 Envoie une photo de l\'incident, ou tape "Fini" pour continuer sans photo.',
      shouldUpdate: false,
    }
  }
}

