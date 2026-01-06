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
      .select("*")
      .eq("club_id", clubId)

    if (courseId && courseId !== "all") {
      baseQuery = baseQuery.eq("course_id", courseId)
    }

    // Activité 24h : incidents reçus depuis hier
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const { data: incidents24h } = await baseQuery
      .gte("created_at", yesterday.toISOString())

    const activity24h = incidents24h?.length || 0

    // Point Chaud : trou avec le plus de signalements cette semaine
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    weekAgo.setHours(0, 0, 0, 0)

    const { data: incidentsWeek } = await baseQuery
      .gte("created_at", weekAgo.toISOString())
      .select("hole_number")

    const holeCounts: Record<number, number> = {}
    incidentsWeek?.forEach((inc) => {
      holeCounts[inc.hole_number] = (holeCounts[inc.hole_number] || 0) + 1
    })

    const hotSpot = Object.entries(holeCounts).reduce(
      (max, [hole, count]) => (count > (holeCounts[max] || 0) ? parseInt(hole) : max),
      0
    )

    // Archives Photos : total des photos ce mois-ci
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    monthAgo.setHours(0, 0, 0, 0)

    const { data: incidentsMonth } = await baseQuery
      .gte("created_at", monthAgo.toISOString())
      .not("photo_url", "is", null)
      .select("photo_url")

    const archivePhotos = incidentsMonth?.length || 0

    return NextResponse.json({
      activity24h,
      hotSpot: hotSpot || null,
      archivePhotos,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

