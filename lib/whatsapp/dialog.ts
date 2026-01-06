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
 * Gère le flux conversationnel du chatbot WhatsApp
 * Logique stricte : Parcours -> Trou -> Photo/Description -> Confirmation
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
    const lowerMessage = this.message.toLowerCase().trim()

    // Gestion de la commande RESET - Vide TOUTES les variables
    if (lowerMessage === "reset" || lowerMessage === "annuler" || lowerMessage === "recommencer") {
      return {
        response: await this.getCourseListMessage(),
        shouldUpdate: true,
        updates: {
          state: "AWAITING_COURSE",
          course_id: null,
          hole_number: null,
          description: null,
          category: null,
          priority: "Medium",
          photo_url: null,
        },
      }
    }

    // Si la session est complétée, on la réinitialise automatiquement pour un nouveau signalement
    if (this.session.state === "COMPLETED") {
      return {
        response: await this.getCourseListMessage(),
        shouldUpdate: true,
        updates: {
          state: "AWAITING_COURSE",
          course_id: null,
          hole_number: null,
          description: null,
          category: null,
          priority: "Medium",
          photo_url: null,
        },
      }
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

      default:
        // État invalide, on réinitialise
        return {
          response: await this.getCourseListMessage(),
          shouldUpdate: true,
          updates: {
            state: "AWAITING_COURSE",
            course_id: null,
            hole_number: null,
            description: null,
            category: null,
            priority: "Medium",
            photo_url: null,
          },
        }
    }
  }

  /**
   * Génère le message de liste des parcours
   */
  private async getCourseListMessage(): Promise<string> {
    const supabase = await createClient()

    const { data: courses } = await supabase
      .from("courses")
      .select("id, name")
      .eq("club_id", this.session.club_id)
      .eq("is_active", true)
      .order("name")

    if (!courses || courses.length === 0) {
      return "❌ Aucun parcours configuré pour ce club."
    }

    const courseList = courses
      .map((course, index) => `${index + 1}. ${course.name}`)
      .join("\n")

    return `Sur quel parcours es-tu ?\n\n${courseList}\n\nRéponds par le numéro (ex: 1, 2, 3) ou le nom du parcours.`
  }

  /**
   * ÉTAPE 1 : Gère la sélection du parcours
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
      const selectedIndex = parseInt(numberMatch[1], 10) - 1 // -1 car la liste commence à 1
      
      // CORRECTION BUG : Validation stricte de l'index
      if (selectedIndex >= 0 && selectedIndex < courses.length) {
        const selectedCourse = courses[selectedIndex]
        return {
          response: `✅ Parcours "${selectedCourse.name}" sélectionné.\n\nSur quel trou es-tu ? (Tapez le numéro de 1 à 18)`,
          shouldUpdate: true,
          updates: {
            state: "AWAITING_HOLE",
            course_id: selectedCourse.id,
            hole_number: null, // S'assurer que hole_number est null
          },
        }
      } else {
        // Numéro invalide
        return {
          response: `❌ Numéro invalide. Veuillez choisir entre 1 et ${courses.length}.\n\n${await this.getCourseListMessage()}`,
          shouldUpdate: false,
        }
      }
    }

    // Vérifier si le message contient le nom d'un parcours
    const courseId = extractCourseName(this.message, courses)
    if (courseId) {
      const selectedCourse = courses.find((c) => c.id === courseId)
      return {
        response: `✅ Parcours "${selectedCourse?.name}" sélectionné.\n\nSur quel trou es-tu ? (Tapez le numéro de 1 à 18)`,
        shouldUpdate: true,
        updates: {
          state: "AWAITING_HOLE",
          course_id: courseId,
          hole_number: null, // S'assurer que hole_number est null
        },
      }
    }

    // Message non reconnu, afficher la liste
    return {
      response: await this.getCourseListMessage(),
      shouldUpdate: false,
    }
  }

  /**
   * ÉTAPE 2 : Gère la sélection du trou (NOUVEAU - étape obligatoire)
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
      .select("id, name, hole_count")
      .eq("id", this.session.course_id)
      .single()

    if (!course) {
      return {
        response: "❌ Parcours introuvable. Tapez 'reset' pour recommencer.",
        shouldUpdate: false,
      }
    }

    // CORRECTION BUG : Extraire le numéro de trou depuis le message actuel uniquement
    // Ne pas utiliser le numéro de l'étape précédente
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

    // Trou valide, passer à l'étape description/photo
    return {
      response: `✅ Trou ${holeNumber} sélectionné.\n\nDécrivez le problème et envoyez une photo.`,
      shouldUpdate: true,
      updates: {
        state: "AWAITING_DESCRIPTION",
        hole_number: holeNumber, // Enregistrer le trou correctement
      },
    }
  }

  /**
   * ÉTAPE 3 : Gère la description et/ou la photo
   */
  private async handleDescription(): Promise<{
    response: string
    shouldUpdate: boolean
    updates?: ChatSessionUpdate
  }> {
    if (!this.session.course_id || !this.session.hole_number) {
      return {
        response: "❌ Erreur : données incomplètes. Tapez 'reset' pour recommencer.",
        shouldUpdate: false,
      }
    }

    // Si une photo est envoyée, on l'enregistre
    if (this.mediaUrl) {
      const category = detectCategory(this.message || "")
      const priority = detectPriority(this.message || "")

      return {
        response: await this.getConfirmationMessage(),
        shouldUpdate: true,
        updates: {
          state: "COMPLETED",
          description: this.message || "Photo envoyée",
          category,
          priority,
          photo_url: this.mediaUrl,
        },
      }
    }

    // Si du texte est envoyé (pas de photo), c'est la description
    if (this.message && this.message.length >= 2) {
      const category = detectCategory(this.message)
      const priority = detectPriority(this.message)

      // Passer à l'étape photo (mais accepter aussi "Fini")
      return {
        response: `✅ Description enregistrée : "${this.message}"\n\n📸 Envoie une photo si possible, ou tape "Fini" pour terminer.`,
        shouldUpdate: true,
        updates: {
          state: "AWAITING_PHOTO",
          description: this.message,
          category,
          priority,
        },
      }
    }

    // Message trop court ou vide
    return {
      response: "❌ Veuillez décrire le problème en quelques mots, ou envoyer une photo.",
      shouldUpdate: false,
    }
  }

  /**
   * ÉTAPE 4 : Gère la photo ou la fin
   */
  private async handlePhoto(): Promise<{
    response: string
    shouldUpdate: boolean
    updates?: ChatSessionUpdate
  }> {
    const lowerMessage = this.message.toLowerCase().trim()

    // Si l'utilisateur dit "Fini" ou "Terminé", on complète sans photo
    if (lowerMessage === "fini" || lowerMessage === "terminé" || lowerMessage === "pas de photo" || lowerMessage === "ok") {
      // S'assurer qu'on a au moins une description
      if (!this.session.description) {
        return {
          response: "❌ Veuillez d'abord décrire le problème en quelques mots.",
          shouldUpdate: false,
        }
      }

      return {
        response: await this.getConfirmationMessage(),
        shouldUpdate: true,
        updates: {
          state: "COMPLETED",
        },
      }
    }

    // Si une photo est fournie, on la stocke et on complète
    if (this.mediaUrl) {
      return {
        response: await this.getConfirmationMessage(),
        shouldUpdate: true,
        updates: {
          state: "COMPLETED",
          photo_url: this.mediaUrl,
        },
      }
    }

    // Si du texte est envoyé (pas "Fini"), on l'ajoute à la description
    if (this.message && this.message.length >= 2) {
      const existingDescription = this.session.description || ""
      const newDescription = existingDescription
        ? `${existingDescription}. ${this.message}`
        : this.message

      const category = detectCategory(newDescription)
      const priority = detectPriority(newDescription)

      return {
        response: `✅ Description mise à jour.\n\n📸 Envoie une photo si possible, ou tape "Fini" pour terminer.`,
        shouldUpdate: true,
        updates: {
          description: newDescription,
          category,
          priority,
        },
      }
    }

    // Sinon, demander la photo ou "Fini"
    return {
      response: '📸 Envoie une photo de l\'incident, ou tape "Fini" pour terminer.',
      shouldUpdate: false,
    }
  }

  /**
   * Génère le message de confirmation avant de compléter
   */
  private async getConfirmationMessage(): Promise<string> {
    const supabase = await createClient()

    // Récupérer le nom du parcours
    const { data: course } = await supabase
      .from("courses")
      .select("name")
      .eq("id", this.session.course_id)
      .single()

    const courseName = course?.name || "Parcours"
    const holeNumber = this.session.hole_number || "?"

    return `✅ Signalé : ${courseName} - Trou ${holeNumber}. C'est bien reçu !`
  }
}
