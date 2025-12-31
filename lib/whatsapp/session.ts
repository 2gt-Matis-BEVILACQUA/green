import { createClient } from "@/lib/supabase/server"

export type ChatState =
  | "AWAITING_COURSE"
  | "AWAITING_HOLE"
  | "AWAITING_DESCRIPTION"
  | "AWAITING_PHOTO"
  | "COMPLETED"

export interface ChatSession {
  id: string
  phone_number: string
  club_id: string
  state: ChatState
  course_id: string | null
  hole_number: number | null
  description: string | null
  category: string | null
  priority: string
  photo_url: string | null
  incident_id: string | null
  last_activity: string
  created_at: string
  updated_at: string
}

export interface ChatSessionUpdate {
  state?: ChatState
  course_id?: string | null
  hole_number?: number | null
  description?: string | null
  category?: string | null
  priority?: string
  photo_url?: string | null
  incident_id?: string | null
}

/**
 * Récupère ou crée une session de chat
 */
export async function getOrCreateSession(
  phoneNumber: string,
  clubId: string
): Promise<ChatSession | null> {
  const supabase = await createClient()

  // Vérifier si une session existe
  const { data: existingSession } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("phone_number", phoneNumber)
    .eq("club_id", clubId)
    .single()

  if (existingSession) {
    // Vérifier si la session a expiré (30 minutes)
    const lastActivity = new Date(existingSession.last_activity)
    const now = new Date()
    const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60)

    if (minutesSinceActivity > 30 && existingSession.state !== "COMPLETED") {
      // Réinitialiser la session expirée
      return await resetSession(phoneNumber, clubId)
    }

    // Mettre à jour last_activity
    await supabase
      .from("chat_sessions")
      .update({ last_activity: new Date().toISOString() })
      .eq("id", existingSession.id)

    return existingSession as ChatSession
  }

  // Créer une nouvelle session
  const { data: newSession, error } = await supabase
    .from("chat_sessions")
    .insert({
      phone_number: phoneNumber,
      club_id: clubId,
      state: "AWAITING_COURSE",
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating session:", error)
    return null
  }

  return newSession as ChatSession
}

/**
 * Met à jour l'état d'une session
 */
export async function updateSession(
  sessionId: string,
  updates: ChatSessionUpdate
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("chat_sessions")
    .update({
      ...updates,
      last_activity: new Date().toISOString(),
    })
    .eq("id", sessionId)

  if (error) {
    console.error("Error updating session:", error)
    return false
  }

  return true
}

/**
 * Réinitialise une session
 */
export async function resetSession(
  phoneNumber: string,
  clubId: string
): Promise<ChatSession | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("chat_sessions")
    .update({
      state: "AWAITING_COURSE",
      course_id: null,
      hole_number: null,
      description: null,
      category: null,
      priority: "Medium",
      photo_url: null,
      incident_id: null,
      last_activity: new Date().toISOString(),
    })
    .eq("phone_number", phoneNumber)
    .eq("club_id", clubId)
    .select()
    .single()

  if (error) {
    console.error("Error resetting session:", error)
    return null
  }

  return data as ChatSession
}

/**
 * Marque une session comme complétée
 */
export async function completeSession(sessionId: string, incidentId: string): Promise<boolean> {
  return await updateSession(sessionId, {
    state: "COMPLETED",
    incident_id: incidentId,
  })
}

