import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const categories = ["Arrosage", "Tonte", "Bunker", "Signaletique", "Autre"]
const priorities = ["Low", "Medium", "High", "Critical"]

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const clubId = "00000000-0000-0000-0000-000000000001" // TODO: Get from auth

    // Récupérer le parcours pour obtenir le nombre de trous
    const courseId = body.course_id
    const { data: course } = await supabase
      .from("courses")
      .select("hole_count")
      .eq("id", courseId)
      .single()

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Générer un incident
    const holeNumber = body.hole_number || Math.floor(Math.random() * course.hole_count) + 1
    const category = body.category || categories[Math.floor(Math.random() * categories.length)]
    const priority = body.priority || priorities[Math.floor(Math.random() * priorities.length)]

    const loop = holeNumber <= Math.ceil(course.hole_count / 2) ? "Aller" : "Retour"

    const { data, error } = await supabase
      .from("incidents")
      .insert({
        club_id: clubId,
        course_id: courseId,
        hole_number: holeNumber,
        loop,
        category,
        description: body.description || `Incident simulé - ${category} sur le trou ${holeNumber}`,
        priority,
        status: "Open",
        reported_by: "+33612345678",
      })
      .select()
      .single()

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

