import crypto from "crypto"

/**
 * Valide la signature Twilio pour sécuriser le webhook
 * @param signature Signature X-Twilio-Signature de l'en-tête
 * @param url URL complète de la requête
 * @param params Paramètres de la requête
 * @param authToken Token d'authentification Twilio
 */
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>,
  authToken: string
): boolean {
  try {
    // Construire la chaîne à signer selon la spécification Twilio
    // URL + paramètres triés par clé (sans le paramètre de signature)
    const sortedKeys = Object.keys(params)
      .filter((key) => key !== "X-Twilio-Signature")
      .sort()

    const sortedParams = sortedKeys
      .map((key) => `${key}${params[key]}`)
      .join("")

    const data = url + sortedParams

    // Calculer le HMAC SHA1
    const computedSignature = crypto
      .createHmac("sha1", authToken)
      .update(Buffer.from(data, "utf-8"))
      .digest("base64")

    // Comparer les signatures (comparaison constante pour éviter les timing attacks)
    if (signature.length !== computedSignature.length) {
      return false
    }

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    )
  } catch (error) {
    console.error("Error validating Twilio signature:", error)
    return false
  }
}

/**
 * Génère une réponse TwiML pour WhatsApp
 */
export function generateTwiMLResponse(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`
}

/**
 * Échappe les caractères XML spéciaux
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

