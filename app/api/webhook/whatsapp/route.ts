import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateTwilioSignature, generateTwiMLResponse } from "@/lib/whatsapp/twilio"
import { uploadImageToStorage, ensureBucketExists } from "@/lib/whatsapp/storage"
import { getOrCreateSession, updateSession, completeSession, resetSession } from "@/lib/whatsapp/session"
import { WhatsAppDialog } from "@/lib/whatsapp/dialog"
import { IncidentCategory } from "@/lib/types"

// Configuration de route pour désactiver le cache et forcer le mode dynamique
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

/**
 * Webhook WhatsApp conversationnel pour recevoir les signalements d'incidents
 * 
 * Format Twilio WhatsApp:
 * - From: Numéro de téléphone expéditeur
 * - Body: Corps du message
 * - MediaUrl0: URL de l'image (optionnel)
 * - X-Twilio-Signature: Signature pour validation
 */

/**
 * OPTIONS - Handler pour les requêtes preflight CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Twilio-Signature',
    },
  })
}

/**
 * GET - Affiche un message informatif (pour test/debug)
 */
export async function GET() {
  return new NextResponse(
    JSON.stringify({
      status: "ok",
      message: "Webhook WhatsApp actif",
      endpoint: "/api/webhook/whatsapp",
      method: "POST",
      description: "Cette route est destinée à recevoir les webhooks de Twilio. Utilisez POST pour envoyer des messages.",
    }),
    {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    }
  )
}

/**
 * POST - Reçoit les messages WhatsApp de Twilio
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

    // Log pour débogage (à retirer en production si nécessaire)
    console.log("[WhatsApp Webhook] Message reçu:", {
      from: fromNumber,
      body: messageBody,
      hasMedia: !!mediaUrl,
    })

    // Validation de signature Twilio (TEMPORAIREMENT DÉSACTIVÉE pour debug)
    // TODO: Réactiver la validation une fois que les messages arrivent correctement
    /*
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
        console.error("[WhatsApp Webhook] Signature invalide")
        return new NextResponse(
          generateTwiMLResponse("❌ Erreur d'authentification. Veuillez contacter l'administrateur."),
          {
            status: 401,
            headers: { 
              "Content-Type": "text/xml",
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
          }
        )
      }
    }
    */

    // Récupérer le club depuis le numéro WhatsApp
    const supabase = await createClient()
    
    // Essayer d'abord avec le numéro exact
    let { data: club, error: clubError } = await supabase
      .from("clubs")
      .select("id, whatsapp_number")
      .eq("whatsapp_number", fromNumber)
      .single()

    // Si pas trouvé, essayer avec le format "whatsapp:+33..." (format Twilio)
    if (!club && fromNumber.startsWith("whatsapp:")) {
      const cleanNumber = fromNumber.replace("whatsapp:", "")
      const { data: clubAlt } = await supabase
        .from("clubs")
        .select("id, whatsapp_number")
        .eq("whatsapp_number", cleanNumber)
        .single()
      if (clubAlt) club = clubAlt
    }

    // Si toujours pas trouvé, essayer sans le préfixe "whatsapp:"
    if (!club && fromNumber.includes(":")) {
      const cleanNumber = fromNumber.split(":")[1]
      const { data: clubAlt2 } = await supabase
        .from("clubs")
        .select("id, whatsapp_number")
        .eq("whatsapp_number", cleanNumber)
        .single()
      if (clubAlt2) club = clubAlt2
    }

    if (!club) {
      console.error("[WhatsApp Webhook] Club non trouvé pour le numéro:", fromNumber)
      console.error("[WhatsApp Webhook] Erreur Supabase:", clubError)
      
      // Récupérer tous les clubs pour debug
      const { data: allClubs } = await supabase
        .from("clubs")
        .select("id, whatsapp_number")
      
      console.error("[WhatsApp Webhook] Clubs disponibles:", allClubs)
      
      return new NextResponse(
        generateTwiMLResponse("❌ Numéro non autorisé. Veuillez contacter l'administrateur."),
        {
          status: 403,
          headers: { 
            "Content-Type": "text/xml",
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
          },
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
          headers: { 
            "Content-Type": "text/xml",
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
          },
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
            headers: { 
              "Content-Type": "text/xml",
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
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
            headers: { 
              "Content-Type": "text/xml",
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
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
            headers: { 
              "Content-Type": "text/xml",
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
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

      // Message de confirmation final (déjà généré par le dialog)
      const confirmationMessage = dialogResult.response

      // Réinitialiser automatiquement la session pour permettre un nouveau signalement immédiat
      await resetSession(fromNumber, clubId)

      return new NextResponse(generateTwiMLResponse(confirmationMessage), {
        status: 200,
        headers: { 
          "Content-Type": "text/xml",
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      })
    }

    // Répondre avec le message du dialogue
    return new NextResponse(generateTwiMLResponse(dialogResult.response), {
      status: 200,
      headers: { 
        "Content-Type": "text/xml",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  } catch (error) {
    console.error("Webhook error:", error)
    return new NextResponse(
      generateTwiMLResponse("❌ Erreur serveur. Veuillez réessayer plus tard."),
      {
        status: 500,
        headers: { 
          "Content-Type": "text/xml",
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      }
    )
  }
}
