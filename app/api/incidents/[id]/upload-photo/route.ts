import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const formData = await request.formData()
    const imageFile = formData.get("image") as File | null

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json(
        { error: "Aucune image fournie" },
        { status: 400 }
      )
    }

    // Vérifier que l'incident existe
    const { data: incident, error: incidentError } = await supabase
      .from("incidents")
      .select("id")
      .eq("id", id)
      .single()

    if (incidentError || !incident) {
      return NextResponse.json(
        { error: "Incident non trouvé" },
        { status: 404 }
      )
    }

    // Upload de l'image
    try {
      const adminClient = createAdminClient()

      // Vérifier que le bucket existe
      const { data: buckets } = await adminClient.storage.listBuckets()
      const bucketExists = buckets?.some((bucket) => bucket.name === "incident-photos")

      if (!bucketExists) {
        await adminClient.storage.createBucket("incident-photos", {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        })
      }

      // Convertir le File en buffer
      const arrayBuffer = await imageFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Générer un nom de fichier unique
      const fileExt = imageFile.name.split(".").pop() || "jpg"
      const fileName = `${id}-${Date.now()}.${fileExt}`

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from("incident-photos")
        .upload(fileName, buffer, {
          contentType: imageFile.type || "image/jpeg",
          upsert: false,
          cacheControl: "3600",
        })

      if (uploadError || !uploadData) {
        console.error("Error uploading image:", uploadError)
        return NextResponse.json(
          { error: "Erreur lors de l'upload de l'image" },
          { status: 500 }
        )
      }

      // Récupérer l'URL publique
      const {
        data: { publicUrl },
      } = adminClient.storage.from("incident-photos").getPublicUrl(fileName)

      // Mettre à jour l'incident avec l'URL de l'image
      const { error: updateError } = await supabase
        .from("incidents")
        .update({ photo_url: publicUrl })
        .eq("id", id)

      if (updateError) {
        console.error("Error updating incident:", updateError)
        return NextResponse.json(
          { error: "Erreur lors de la mise à jour de l'incident" },
          { status: 500 }
        )
      }

      return NextResponse.json({ photo_url: publicUrl })
    } catch (storageError) {
      console.error("Error in storage operation:", storageError)
      return NextResponse.json(
        { error: "Erreur lors du traitement de l'image" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error in upload-photo:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}