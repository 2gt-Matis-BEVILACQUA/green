import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get("club_id") || "00000000-0000-0000-0000-000000000001"
    const courseId = searchParams.get("course_id")
    const status = searchParams.get("status")

    let query = supabase
      .from("incidents")
      .select("*")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })

    if (courseId) {
      query = query.eq("course_id", courseId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
