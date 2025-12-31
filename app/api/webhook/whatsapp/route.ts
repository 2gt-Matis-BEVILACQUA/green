import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateTwilioSignature, generateTwiMLResponse } from "@/lib/whatsapp/twilio"
import { uploadImageToStorage, ensureBucketExists } from "@/lib/whatsapp/storage"
import { getOrCreateSession, updateSession, completeSession } from "@/lib/whatsapp/session"
import { WhatsAppDialog } from "@/lib/whatsapp/dialog"
import { IncidentCategory } from "@/lib/types"

/**
 * Webhook WhatsApp conversationnel pour recevoir les signalements d'incidents
 * 
 * Format Twilio WhatsApp:
 * - From: Numéro de téléphone expéditeur
 * - Body: Corps du message
 * - MediaUrl0: URL de l'image (optionnel)
 * - X-Twilio-Signature: Signature pour validation
 */
export async function POST(request: Request) {
  try {
    // Récupérer les données du formulaire Twilio
    const formData = await request.formData()
    const body: Record<string, string> = {}
    
    for (const [key, value] of formData.entries()) {
      body[key] = value.toString()
    }

    const fromNumber = body.From || ""
    const messageBody = body.Body || ""
    const mediaUrl = body.MediaUrl0 || ""
    const twilioSignature = request.headers.get("X-Twilio-Signature") || ""

    // Validation de signature Twilio (optionnel en dev, requis en prod)
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    if (twilioAuthToken && twilioSignature) {
      const protocol = request.headers.get("x-forwarded-proto") || "https"
      const host = request.headers.get("host") || ""
      const pathname = new URL(request.url).pathname
      const fullUrl = `${protocol}://${host}${pathname}`
      
      const isValid = validateTwilioSignature(
        twilioSignature,
        fullUrl,
        body,
        twilioAuthToken
      )

      if (!isValid) {
        return new NextResponse(
          generateTwiMLResponse("❌ Erreur d'authentification. Veuillez contacter l'administrateur."),
          {
            status: 401,
            headers: { "Content-Type": "text/xml" },
          }
        )
      }
    }

    // Récupérer le club depuis le numéro WhatsApp
    const supabase = await createClient()
    const { data: club } = await supabase
      .from("clubs")
      .select("id")
      .eq("whatsapp_number", fromNumber)
      .single()

    if (!club) {
      return new NextResponse(
        generateTwiMLResponse("❌ Numéro non autorisé. Veuillez contacter l'administrateur."),
        {
          status: 403,
          headers: { "Content-Type": "text/xml" },
        }
      )
    }

    const clubId = club.id

    // Récupérer ou créer la session de chat
    const session = await getOrCreateSession(fromNumber, clubId)
    if (!session) {
      return new NextResponse(
        generateTwiMLResponse("❌ Erreur lors de la création de la session. Veuillez réessayer."),
        {
          status: 500,
          headers: { "Content-Type": "text/xml" },
        }
      )
    }

    // Traiter le message avec le système de dialogue
    const dialog = new WhatsAppDialog(session, messageBody, mediaUrl || null)
    const dialogResult = await dialog.process()

    // Mettre à jour la session si nécessaire
    if (dialogResult.shouldUpdate && dialogResult.updates) {
      await updateSession(session.id, dialogResult.updates)
    }

    // Si la session est complétée, créer l'incident
    if (dialogResult.updates?.state === "COMPLETED") {
      const updatedSession = { ...session, ...dialogResult.updates }

      // Vérifier que toutes les données nécessaires sont présentes
      if (!updatedSession.course_id || !updatedSession.hole_number || !updatedSession.description) {
        return new NextResponse(
          generateTwiMLResponse("❌ Données incomplètes. Veuillez recommencer avec 'reset'."),
          {
            status: 400,
            headers: { "Content-Type": "text/xml" },
          }
        )
      }

      // Récupérer les détails du parcours pour calculer le loop
      const { data: courseData } = await supabase
        .from("courses")
        .select("id, name, hole_count")
        .eq("id", updatedSession.course_id)
        .single()

      if (!courseData) {
        return new NextResponse(
          generateTwiMLResponse("❌ Parcours introuvable. Veuillez recommencer avec 'reset'."),
          {
            status: 400,
            headers: { "Content-Type": "text/xml" },
          }
        )
      }

      // Calculer le loop
      const loop =
        updatedSession.hole_number <= Math.ceil(courseData.hole_count / 2) ? "Aller" : "Retour"

      // Créer l'incident
      const { data: incident, error: insertError } = await supabase
        .from("incidents")
        .insert({
          club_id: clubId,
          course_id: updatedSession.course_id,
          hole_number: updatedSession.hole_number,
          loop,
          category: (updatedSession.category as IncidentCategory) || "Autre",
          description: updatedSession.description,
          priority: updatedSession.priority || "Medium",
          status: "Open",
          reported_by: fromNumber,
          photo_url: null, // Sera mis à jour après upload si présent
        })
        .select()
        .single()

      if (insertError || !incident) {
        console.error("Error creating incident:", insertError)
        return new NextResponse(
          generateTwiMLResponse("❌ Erreur lors de l'enregistrement. Veuillez réessayer."),
          {
            status: 500,
            headers: { "Content-Type": "text/xml" },
          }
        )
      }

      // Upload de l'image si présente
      let publicImageUrl: string | null = null
      if (updatedSession.photo_url) {
        try {
          await ensureBucketExists()
          publicImageUrl = await uploadImageToStorage(updatedSession.photo_url, incident.id)

          // Mettre à jour l'incident avec l'URL de l'image
          await supabase
            .from("incidents")
            .update({ photo_url: publicImageUrl })
            .eq("id", incident.id)
        } catch (storageError) {
          console.error("Error uploading image:", storageError)
          // On continue même si l'upload échoue
        }
      }

      // Marquer la session comme complétée
      await completeSession(session.id, incident.id)

      // Message de confirmation final
      const confirmationMessage = `✅ Signalement enregistré au Trou ${updatedSession.hole_number} sur ${courseData.name}.\n\nVisible sur le Dashboard. Merci !`

      return new NextResponse(generateTwiMLResponse(confirmationMessage), {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      })
    }

    // Répondre avec le message du dialogue
    return new NextResponse(generateTwiMLResponse(dialogResult.response), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    })
  } catch (error) {
    console.error("Webhook error:", error)
    return new NextResponse(
      generateTwiMLResponse("❌ Erreur serveur. Veuillez réessayer plus tard."),
      {
        status: 500,
        headers: { "Content-Type": "text/xml" },
      }
    )
  }
}
