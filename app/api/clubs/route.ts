import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get("id") || "00000000-0000-0000-0000-000000000001"

    const { data, error } = await supabase
      .from("clubs")
      .select("*")
      .eq("id", clubId)
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

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const clubId = body.id || "00000000-0000-0000-0000-000000000001"

    const updateData: any = {}
    if (body.nom !== undefined) updateData.nom = body.nom
    if (body.adresse !== undefined) updateData.adresse = body.adresse
    if (body.logo !== undefined) updateData.logo = body.logo
    if (body.whatsapp_number !== undefined) updateData.whatsapp_number = body.whatsapp_number
    if (body.api_key !== undefined) updateData.api_key = body.api_key

    const { data, error } = await supabase
      .from("clubs")
      .update(updateData)
      .eq("id", clubId)
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

