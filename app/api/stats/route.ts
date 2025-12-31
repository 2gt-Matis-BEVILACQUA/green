import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get("club_id") || "00000000-0000-0000-0000-000000000001"
    const courseId = searchParams.get("course_id")

    let baseQuery = supabase
      .from("incidents")
      .select("id")
      .eq("club_id", clubId)

    if (courseId) {
      baseQuery = baseQuery.eq("course_id", courseId)
    }

    // Incidents actifs
    const { data: activeIncidents, error: activeError } = await baseQuery
      .in("status", ["Open", "In_Progress"])

    if (activeError) {
      return NextResponse.json({ error: activeError.message }, { status: 500 })
    }

    // Urgences (High ou Critical)
    let urgentQuery = supabase
      .from("incidents")
      .select("id")
      .eq("club_id", clubId)
      .in("status", ["Open", "In_Progress"])
      .in("priority", ["High", "Critical"])
    
    if (courseId) {
      urgentQuery = urgentQuery.eq("course_id", courseId)
    }

    const { data: urgentIncidents, error: urgentError } = await urgentQuery

    if (urgentError) {
      return NextResponse.json({ error: urgentError.message }, { status: 500 })
    }

    // Taux de résolution 7 jours
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    let resolvedQuery = supabase
      .from("incidents")
      .select("id, created_at, resolved_at")
      .eq("club_id", clubId)
      .eq("status", "Resolved")
      .gte("created_at", sevenDaysAgo.toISOString())

    if (courseId) {
      resolvedQuery = resolvedQuery.eq("course_id", courseId)
    }

    const { data: resolvedIncidents, error: resolvedError } = await resolvedQuery

    if (resolvedError) {
      return NextResponse.json({ error: resolvedError.message }, { status: 500 })
    }

    let totalQuery = supabase
      .from("incidents")
      .select("id")
      .eq("club_id", clubId)
      .gte("created_at", sevenDaysAgo.toISOString())

    if (courseId) {
      totalQuery = totalQuery.eq("course_id", courseId)
    }

    const { data: totalIncidents, error: totalError } = await totalQuery

    if (totalError) {
      return NextResponse.json({ error: totalError.message }, { status: 500 })
    }

    const resolutionRate =
      totalIncidents && totalIncidents.length > 0
        ? Math.round((resolvedIncidents.length / totalIncidents.length) * 100)
        : 0

    // Dernier relevé
    let lastQuery = supabase
      .from("incidents")
      .select("created_at")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .limit(1)

    if (courseId) {
      lastQuery = lastQuery.eq("course_id", courseId)
    }

    const { data: lastIncident, error: lastError } = await lastQuery.single()

    if (lastError && lastError.code !== "PGRST116") {
      return NextResponse.json({ error: lastError.message }, { status: 500 })
    }

    return NextResponse.json({
      activeIncidents: activeIncidents?.length || 0,
      urgentIncidents: urgentIncidents?.length || 0,
      resolutionRate,
      lastReleve: lastIncident?.created_at || null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

