import { createAdminClient } from "@/lib/supabase/admin"

const BUCKET_NAME = "incident-photos"

/**
 * Télécharge une image depuis une URL et l'upload dans Supabase Storage
 * @param imageUrl URL de l'image depuis Twilio
 * @param incidentId ID de l'incident pour nommer le fichier
 * @returns URL publique de l'image dans Supabase Storage
 */
export async function uploadImageToStorage(
  imageUrl: string,
  incidentId: string
): Promise<string> {
  try {
    const supabase = createAdminClient()

    // Télécharger l'image depuis Twilio
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const imageBlob = await response.blob()
    const arrayBuffer = await imageBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Générer un nom de fichier unique
    const fileExt = imageUrl.split(".").pop()?.split("?")[0] || "jpg"
    const fileName = `${incidentId}-${Date.now()}.${fileExt}`

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: imageBlob.type || "image/jpeg",
        upsert: false,
        cacheControl: "3600",
      })

    if (error) {
      // Si le fichier existe déjà, essayer avec un nom différent
      if (error.message.includes("already exists") || error.message.includes("duplicate")) {
        const newFileName = `${incidentId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const { data: retryData, error: retryError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(newFileName, buffer, {
            contentType: imageBlob.type || "image/jpeg",
            upsert: false,
            cacheControl: "3600",
          })
        
        if (retryError) {
          throw new Error(`Storage upload failed: ${retryError.message}`)
        }
        
        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET_NAME).getPublicUrl(newFileName)
        return publicUrl
      }
      
      throw new Error(`Storage upload failed: ${error.message}`)
    }

    // Récupérer l'URL publique
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error("Error uploading image to storage:", error)
    throw error
  }
}

/**
 * Vérifie si le bucket existe, sinon le crée
 */
export async function ensureBucketExists(): Promise<void> {
  const supabase = createAdminClient()

  // Vérifier si le bucket existe
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`)
  }

  const bucketExists = buckets?.some((bucket) => bucket.name === BUCKET_NAME)

  if (!bucketExists) {
    // Créer le bucket (nécessite des permissions admin)
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    })

    if (createError) {
      console.warn(`Bucket creation failed (may already exist): ${createError.message}`)
    }
  }
}

