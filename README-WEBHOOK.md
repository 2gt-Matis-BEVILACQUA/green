# 📡 Guide d'Intégration WhatsApp Webhook

## Configuration

### 1. Variables d'environnement

Ajoutez dans votre `.env.local` :

```env
# Twilio (optionnel pour la validation de signature)
TWILIO_AUTH_TOKEN="votre_auth_token_twilio"

# Supabase (déjà configuré)
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

### 2. Création du Bucket Supabase Storage

Le bucket `incident-photos` sera créé automatiquement au premier upload, mais vous pouvez le créer manuellement :

1. Allez dans **Storage** > **Buckets** dans votre dashboard Supabase
2. Créez un nouveau bucket nommé `incident-photos`
3. Configurez-le comme **Public** pour permettre l'accès aux images
4. Limite de taille : 5MB
5. Types MIME autorisés : `image/jpeg`, `image/png`, `image/webp`

### 3. Configuration Twilio WhatsApp

1. Dans votre console Twilio, allez dans **Messaging** > **WhatsApp Senders**
2. Configurez votre numéro WhatsApp
3. Dans **Webhooks**, ajoutez l'URL de votre webhook :
   ```
   https://votre-domaine.com/api/webhook/whatsapp
   ```
4. Méthode : **POST**
5. Format : **HTTP POST (application/x-www-form-urlencoded)**

### 4. Configuration du Club

Dans la page **Paramètres** de GreenLog OS :

1. Allez dans l'onglet **WhatsApp**
2. Entrez le **Numéro de téléphone WhatsApp** lié à votre compte Twilio
3. (Optionnel) Entrez votre **API Key** pour la validation

## Utilisation

### Format du message WhatsApp

Le jardinier peut envoyer un message au format :

```
Trou 5 - Problème d'arrosage sur L'Océan
```

**Éléments détectés automatiquement :**
- **Trou** : "Trou 5", "T4", "trou4", "5ème trou"
- **Parcours** : Si le nom du parcours est mentionné, sinon utilise le parcours par défaut
- **Catégorie** : Détectée via mots-clés (arrosage, tonte, bunker, etc.)
- **Priorité** : Détectée via mots-clés (urgent, critique, etc.)

### Catégories détectées

- **Arrosage** : arrosage, arrose, eau, fuite, irrigation, sprinkler, goutte, humidité
- **Tonte** : tonte, tondeuse, herbe, gazon, pelouse, coupe, tondre, hauteur
- **Bunker** : bunker, sable, trap, fosse, dune, sableux
- **Signalétique** : signal, panneau, indication, flèche, direction, marqueur, drapeau
- **Autre** : Par défaut si aucune catégorie n'est détectée

### Exemples de messages

```
Trou 3 - Fuite d'eau importante
```
→ Trou 3, Catégorie: Arrosage, Priorité: Medium

```
T4 L'Océan - Urgent ! Bunker rempli de sable
```
→ Trou 4, Parcours: L'Océan, Catégorie: Bunker, Priorité: Critical

```
Trou 12 - Problème de tonte, herbe trop haute
```
→ Trou 12, Catégorie: Tonte, Priorité: Medium

## Sécurité

### Validation de signature Twilio

Si `TWILIO_AUTH_TOKEN` est configuré, le webhook valide automatiquement la signature de chaque requête pour s'assurer qu'elle provient bien de Twilio.

**En développement** : Vous pouvez désactiver temporairement cette validation en ne définissant pas `TWILIO_AUTH_TOKEN`.

## Réponses automatiques

Le webhook répond automatiquement avec des messages TwiML :

- ✅ **Succès** : "Incident enregistré au Trou X sur [Parcours]..."
- ❌ **Erreur** : Messages d'erreur explicites
- 📸 **Photo manquante** : "Veuillez envoyer une photo..."
- ❌ **Trou invalide** : "Impossible de détecter le numéro de trou..."

## Dépannage

### L'image n'est pas uploadée

1. Vérifiez que le bucket `incident-photos` existe dans Supabase Storage
2. Vérifiez que le bucket est configuré comme **Public**
3. Vérifiez les logs serveur pour les erreurs d'upload

### Le message n'est pas parsé correctement

1. Vérifiez que le format du message contient un numéro de trou
2. Vérifiez que le parcours existe et est actif
3. Consultez les logs pour voir ce qui a été détecté

### La validation Twilio échoue

1. Vérifiez que `TWILIO_AUTH_TOKEN` est correct
2. Vérifiez que l'URL du webhook dans Twilio correspond exactement à votre URL
3. En développement, vous pouvez désactiver temporairement la validation

