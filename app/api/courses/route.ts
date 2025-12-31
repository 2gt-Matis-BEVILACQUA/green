import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get("club_id") || "00000000-0000-0000-0000-000000000001"
    const activeOnly = searchParams.get("active_only") === "true"

    let query = supabase
      .from("courses")
      .select("*")
      .eq("club_id", clubId)
      .order("name", { ascending: true })

    if (activeOnly) {
      query = query.eq("is_active", true)
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

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const clubId = body.club_id || "00000000-0000-0000-0000-000000000001"

    const { data, error } = await supabase
      .from("courses")
      .insert({
        club_id: clubId,
        name: body.name,
        hole_count: body.hole_count,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

