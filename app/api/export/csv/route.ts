import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    // Générer le CSV
    const headers = [
      "Date",
      "Parcours",
      "Trou",
      "Catégorie",
      "Priorité",
      "Statut",
      "Description",
      "Signalé par",
      ...(includeNotes ? ["Note interne"] : []),
    ]

    const csvRows = [
      headers.join(";"),
      ...filteredIncidents.map((inc: any) => {
        const row = [
          new Date(inc.created_at).toLocaleDateString("fr-FR"),
          inc.courses?.name || "N/A",
          inc.hole_number.toString(),
          inc.category,
          inc.priority,
          inc.status,
          `"${(inc.description || "").replace(/"/g, '""')}"`,
          inc.reported_by || "",
          ...(includeNotes ? [`"${(inc.internal_note || "").replace(/"/g, '""')}"`] : []),
        ]
        return row.join(";")
      }),
    ]

    const csvContent = csvRows.join("\n")
    const csvBuffer = Buffer.from(csvContent, "utf-8")

    return new NextResponse(csvBuffer, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Export_TerrainSync_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error("Erreur lors de la génération du CSV:", error)
    return NextResponse.json({ error: error.message || "Erreur lors de la génération du CSV" }, { status: 500 })
  }
}

