import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const clubId = "00000000-0000-0000-0000-000000000001"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
    
    const courseId = formData.get("course_id") as string
    const holeNumber = parseInt(formData.get("hole_number") as string)
    const category = formData.get("category") as string
    const description = formData.get("description") as string
    const priority = (formData.get("priority") as string) || "Medium"
    const imageFile = formData.get("image") as File | null

    // Validation
    if (!courseId || !holeNumber || !category || !description) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      )
    }

    // Récupérer le parcours pour déterminer le loop
    const { data: course } = await supabase
      .from("courses")
      .select("hole_count")
      .eq("id", courseId)
      .single()

    if (!course) {
      return NextResponse.json(
        { error: "Parcours non trouvé" },
        { status: 404 }
      )
    }

    const loop = holeNumber <= Math.ceil(course.hole_count / 2) ? "Aller" : "Retour"

    // Créer l'incident
    const { data: incident, error: insertError } = await supabase
      .from("incidents")
      .insert({
        club_id: clubId,
        course_id: courseId,
        hole_number: holeNumber,
        loop,
        category,
        description,
        priority,
        status: "Open",
        reported_by: "+33612345678", // Numéro de test
        photo_url: null,
      })
      .select()
      .single()

    if (insertError || !incident) {
      console.error("Error creating incident:", insertError)
      return NextResponse.json(
        { error: "Erreur lors de la création de l'incident" },
        { status: 500 }
      )
    }

    // Upload de l'image si présente
    if (imageFile && imageFile.size > 0) {
      try {
        const adminClient = createAdminClient()
        
        // Vérifier que le bucket existe
        const { data: buckets } = await adminClient.storage.listBuckets()
        const bucketExists = buckets?.some((bucket) => bucket.name === "incident-photos")
        
        if (!bucketExists) {
          await adminClient.storage.createBucket("incident-photos", {
            public: true,
            fileSizeLimit: 5242880,
            allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
          })
        }
        
        // Convertir le File en buffer
        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        // Générer un nom de fichier unique
        const fileExt = imageFile.name.split(".").pop() || "jpg"
        const fileName = `${incident.id}-${Date.now()}.${fileExt}`
        
        // Upload vers Supabase Storage
        const { data: uploadData, error: uploadError } = await adminClient.storage
          .from("incident-photos")
          .upload(fileName, buffer, {
            contentType: imageFile.type || "image/jpeg",
            upsert: false,
            cacheControl: "3600",
          })

        if (!uploadError && uploadData) {
          // Récupérer l'URL publique
          const {
            data: { publicUrl },
          } = adminClient.storage.from("incident-photos").getPublicUrl(fileName)

          // Mettre à jour l'incident avec l'URL de l'image
          await supabase
            .from("incidents")
            .update({ photo_url: publicUrl })
            .eq("id", incident.id)

          return NextResponse.json({
            ...incident,
            photo_url: publicUrl,
          })
        }
      } catch (storageError) {
        console.error("Error uploading image:", storageError)
        // On continue même si l'upload échoue
      }
    }

    return NextResponse.json(incident)
  } catch (error) {
    console.error("Error in inject-incident:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}