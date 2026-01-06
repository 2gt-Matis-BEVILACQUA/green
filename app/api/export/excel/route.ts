import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as XLSX from "xlsx"

const clubId = "00000000-0000-0000-0000-000000000001"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      startDate,
      endDate,
      courseId,
      includeOpen,
      includeResolved,
      urgentOnly,
      includeNotes,
      clubName,
    } = body

    const supabase = await createClient()

    // Récupérer les incidents
    let query = supabase
      .from("incidents")
      .select("*, courses(name)")
      .eq("club_id", clubId)
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false })

    // Gérer le multi-parcours
    if (courseId && courseId !== "all") {
      const courseIds = courseId.includes(",") ? courseId.split(",") : [courseId]
      if (courseIds.length === 1) {
        query = query.eq("course_id", courseIds[0])
      } else {
        query = query.in("course_id", courseIds)
      }
    }

    const { data: incidents, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filtrer selon les critères
    let filteredIncidents = incidents || []
    
    if (urgentOnly) {
      filteredIncidents = filteredIncidents.filter(
        (inc: any) => inc.priority === "Critical" || inc.priority === "High"
      )
    } else {
      const statusFilter: string[] = []
      if (includeOpen) statusFilter.push("Open", "In_Progress")
      if (includeResolved) statusFilter.push("Resolved")
      
      if (statusFilter.length > 0) {
        filteredIncidents = filteredIncidents.filter((inc: any) =>
          statusFilter.includes(inc.status)
        )
      }
    }

    // Préparer les données pour Excel
    const headers = [
      "Date",
      "Heure",
      "Parcours",
      "Trou",
      "Catégorie",
      "Priorité",
      "Statut",
      "Message",
      ...(includeNotes ? ["Note Interne"] : []),
    ]

    const rows = filteredIncidents.map((inc: any) => {
      const date = new Date(inc.created_at)
      const row: any[] = [
        date.toLocaleDateString("fr-FR"),
        date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        inc.courses?.name || "N/A",
        inc.hole_number,
        inc.category,
        inc.priority,
        inc.status,
        inc.description || "",
      ]
      if (includeNotes) {
        row.push(inc.internal_note || "")
      }
      return row
    })

    // Créer le workbook
    const workbook = XLSX.utils.book_new()
    
    // Créer la feuille avec les données
    const worksheetData = [headers, ...rows]
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Styliser l'en-tête (ligne 1)
    worksheet["!rows"] = [
      { hpt: 20 }, // Hauteur de la première ligne
    ]

    // Définir les largeurs de colonnes
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 8 },  // Heure
      { wch: 15 }, // Parcours
      { wch: 6 },  // Trou
      { wch: 12 }, // Catégorie
      { wch: 10 }, // Priorité
      { wch: 10 }, // Statut
      { wch: 40 }, // Message
    ]
    if (includeNotes) {
      colWidths.push({ wch: 40 }) // Note Interne
    }
    worksheet["!cols"] = colWidths

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Incidents")

    // Générer le buffer Excel
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Nom du fichier
    const fileName = `Rapport_TerrainSync_${(clubName || "TerrainSync").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error: any) {
    console.error("Erreur lors de la génération du fichier Excel:", error)
    return NextResponse.json({ error: error.message || "Erreur lors de la génération du fichier Excel" }, { status: 500 })
  }
}

