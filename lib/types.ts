// Types pour les enums (remplace @prisma/client)
export type IncidentCategory = "Arrosage" | "Tonte" | "Bunker" | "Signaletique" | "Autre"
export type Priority = "Low" | "Medium" | "High" | "Critical"
export type IncidentStatus = "Open" | "In_Progress" | "Resolved"
export type Loop = "Aller" | "Retour"

export interface Course {
  id: string
  club_id: string
  name: string
  hole_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Incident {
  id: string
  created_at: string
  club_id: string
  course_id: string
  hole_number: number
  loop?: Loop
  category: IncidentCategory
  description: string | null
  photo_url: string | null
  priority: Priority
  status: IncidentStatus
  reported_by: string | null
  resolved_at: string | null
  internal_note?: string | null
}

export interface Club {
  id: string
  nom: string
  adresse: string | null
  logo: string | null
  whatsapp_number: string | null
  api_key: string | null
  created_at: string
  updated_at: string
}
