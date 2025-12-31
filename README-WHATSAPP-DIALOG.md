# Système de Dialogue Conversationnel WhatsApp - GreenLog

## Vue d'ensemble

Le système de dialogue conversationnel permet aux jardiniers de signaler des incidents via WhatsApp en suivant un flux guidé étape par étape. Le bot gère l'état de chaque conversation et guide l'utilisateur à travers les différentes étapes nécessaires.

## Architecture

### 1. Table `chat_sessions` (Supabase)

La table stocke l'état de chaque conversation par numéro de téléphone et club :

```sql
- id: UUID (clé primaire)
- phone_number: VARCHAR(20) (numéro WhatsApp)
- club_id: UUID (référence au club)
- state: VARCHAR(50) (état actuel de la conversation)
- course_id: UUID (parcours sélectionné)
- hole_number: INTEGER (numéro de trou)
- description: TEXT (description de l'incident)
- category: VARCHAR(20) (catégorie détectée)
- priority: VARCHAR(10) (priorité détectée)
- photo_url: TEXT (URL de la photo Twilio temporaire)
- incident_id: UUID (ID de l'incident créé)
- last_activity: TIMESTAMP (dernière activité)
- created_at, updated_at: TIMESTAMP
```

**États possibles :**
- `AWAITING_COURSE` : En attente de sélection du parcours
- `AWAITING_HOLE` : En attente du numéro de trou
- `AWAITING_DESCRIPTION` : En attente de la description
- `AWAITING_PHOTO` : En attente de la photo (ou "Fini")
- `COMPLETED` : Session complétée

### 2. Modules TypeScript

#### `lib/whatsapp/session.ts`
Gère les opérations CRUD sur les sessions :
- `getOrCreateSession()` : Récupère ou crée une session
- `updateSession()` : Met à jour l'état d'une session
- `resetSession()` : Réinitialise une session
- `completeSession()` : Marque une session comme complétée

#### `lib/whatsapp/dialog.ts`
Classe `WhatsAppDialog` qui gère la logique conversationnelle :
- `process()` : Méthode principale qui route le message selon l'état
- `tryParseCompleteMessage()` : Parsing intelligent pour détecter toutes les infos d'un coup
- `handleCourseSelection()` : Gère la sélection du parcours
- `handleHoleSelection()` : Gère la sélection du trou avec validation
- `handleDescription()` : Gère la description
- `handlePhoto()` : Gère l'envoi de photo ou "Fini"

#### `app/api/webhook/whatsapp/route.ts`
Webhook principal qui :
1. Valide la signature Twilio
2. Récupère ou crée la session
3. Traite le message avec `WhatsAppDialog`
4. Met à jour la session
5. Crée l'incident si la session est complétée
6. Upload la photo vers Supabase Storage

## Flux Conversationnel

### Étape 1 : Sélection du Parcours
**État :** `AWAITING_COURSE`

**Message utilisateur :** "Hello", "Bonjour", ou numéro/nom du parcours

**Réponse bot :**
```
Bonjour ! Sur quel parcours es-tu ?

1. L'Océan
2. La Forêt

Réponds par le numéro ou le nom du parcours.
```

**Validation :**
- Si numéro : vérifie que c'est entre 1 et le nombre de parcours
- Si nom : recherche dans la liste des parcours actifs

### Étape 2 : Sélection du Trou
**État :** `AWAITING_HOLE`

**Message utilisateur :** Numéro de trou (ex: "4", "Trou 4")

**Réponse bot :**
```
✅ Parcours "L'Océan" sélectionné.

Quel numéro de trou ?
```

**Validation :**
- Extrait le numéro avec `extractHoleNumber()`
- Vérifie que le numéro est entre 1 et `hole_count` du parcours
- Si invalide : `❌ Le parcours "L'Océan" n'a que 18 trous. Veuillez indiquer un numéro entre 1 et 18.`

### Étape 3 : Description
**État :** `AWAITING_DESCRIPTION`

**Message utilisateur :** Description du problème

**Réponse bot :**
```
✅ Trou 4 sélectionné.

Décris-moi le problème en quelques mots.
```

**Détection automatique :**
- Catégorie : `detectCategory()` (Arrosage, Tonte, Bunker, Signaletique, Autre)
- Priorité : `detectPriority()` (Low, Medium, High, Critical)

### Étape 4 : Photo
**État :** `AWAITING_PHOTO`

**Message utilisateur :** Photo ou "Fini"

**Réponse bot :**
```
✅ Description enregistrée.

📸 Envoie une photo de l'incident si possible, ou tape "Fini" pour continuer sans photo.
```

**Finalisation :**
- Si photo : Upload vers Supabase Storage, création de l'incident
- Si "Fini" : Création de l'incident sans photo

**Message final :**
```
✅ Signalement enregistré au Trou 4 sur L'Océan.

Visible sur le Dashboard. Merci !
```

## Parsing Intelligent

Le système peut détecter toutes les informations dans un seul message :

**Exemple :** "Trou 4 sur L'Océan, fuite d'eau"

**Détection :**
- Trou : 4
- Parcours : L'Océan
- Description : "fuite d'eau"
- Catégorie : Arrosage (détectée automatiquement)
- Priorité : Medium (par défaut)

**Réponse :**
```
✅ Parcours "L'Océan", Trou 4 détecté.

📸 Envoie une photo de l'incident, ou tape "Fini" pour continuer sans photo.
```

## Commandes Spéciales

- **"reset"**, **"annuler"**, **"recommencer"** : Réinitialise la session
- **"Hello"**, **"Bonjour"**, **"Salut"** : Démarre une nouvelle conversation
- **"Fini"**, **"Terminé"**, **"pas de photo"** : Continue sans photo

## Timeout et Expiration

- **Timeout :** 30 minutes d'inactivité
- **Comportement :** La session est automatiquement réinitialisée si aucune activité pendant 30 minutes
- **Fonction SQL :** `cleanup_expired_sessions()` (peut être appelée via cron)

## Validation et Robustesse

### Validation des Entrées
- **Numéro de trou :** Vérifie que c'est entre 1 et `hole_count`
- **Parcours :** Vérifie que le parcours existe et est actif
- **Description :** Minimum 3 caractères

### Gestion d'Erreurs
- **Session introuvable :** Crée une nouvelle session
- **Parcours invalide :** Demande de corriger
- **Upload photo échoue :** Continue sans photo, l'incident est créé
- **Erreur BDD :** Message d'erreur clair à l'utilisateur

## Installation

1. **Exécuter la migration SQL :**
   ```sql
   -- Exécuter supabase/migration-chat-sessions.sql dans Supabase
   ```

2. **Variables d'environnement :**
   ```env
   TWILIO_AUTH_TOKEN=your_token
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

3. **Configuration Twilio :**
   - Configurer le webhook URL : `https://your-domain.com/api/webhook/whatsapp`
   - Activer la validation de signature en production

## Tests

### Scénario 1 : Conversation complète
1. Envoyer "Hello" → Liste des parcours
2. Répondre "1" → Demande du trou
3. Répondre "4" → Demande de description
4. Répondre "Fuite d'eau" → Demande de photo
5. Envoyer une photo → Incident créé ✅

### Scénario 2 : Message complet
1. Envoyer "Trou 4 sur L'Océan, fuite d'eau" → Demande de photo
2. Envoyer "Fini" → Incident créé ✅

### Scénario 3 : Reset
1. Pendant une conversation, envoyer "reset" → Retour à l'étape 1

## Synchronisation Dashboard

Lorsqu'un incident est créé :
1. L'incident est inséré dans la table `incidents`
2. Supabase Realtime déclenche une mise à jour
3. Le dashboard se met à jour automatiquement (via subscription)
4. L'utilisateur reçoit une confirmation WhatsApp

## Maintenance

### Nettoyage des sessions expirées
```sql
-- Exécuter manuellement ou via cron
SELECT cleanup_expired_sessions();
```

### Monitoring
- Vérifier les sessions bloquées : `SELECT * FROM chat_sessions WHERE state != 'COMPLETED' AND last_activity < NOW() - INTERVAL '1 hour';`
- Statistiques : `SELECT state, COUNT(*) FROM chat_sessions GROUP BY state;`

