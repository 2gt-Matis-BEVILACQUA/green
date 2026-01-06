# 🔍 Guide de Vérification Supabase pour WhatsApp

Ce guide vous permet de vérifier que votre base de données Supabase est correctement configurée pour recevoir les signalements WhatsApp.

## 📋 Étapes de Vérification

### 1. Exécuter le Script SQL de Vérification

1. **Ouvrez votre Dashboard Supabase**
   - Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sélectionnez votre projet

2. **Ouvrez l'éditeur SQL**
   - Cliquez sur **SQL Editor** dans le menu de gauche
   - Cliquez sur **New Query**

3. **Exécutez le script de vérification**
   - Copiez le contenu du fichier `supabase/verification-whatsapp.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur **Run** (ou `Ctrl+Enter`)

4. **Analysez les résultats**
   - ✅ = Tout est OK
   - ⚠️ = Attention (optionnel mais recommandé)
   - ❌ = Erreur (à corriger)

### 2. Vérifier les Tables Manquantes

Si le script indique des tables manquantes, exécutez dans l'ordre :

1. **`supabase/schema.sql`** - Crée les tables de base (clubs, courses, incidents)
2. **`supabase/migration-chat-sessions.sql`** - Crée la table chat_sessions
3. **`supabase/migration-add-internal-notes.sql`** - Ajoute la colonne internal_note (optionnel)

### 3. Vérifier le Bucket Supabase Storage

Le bucket `incident-photos` est nécessaire pour stocker les photos des incidents.

#### Vérification Manuelle :

1. **Dans le Dashboard Supabase**
   - Allez dans **Storage** > **Buckets**
   - Vérifiez qu'un bucket nommé `incident-photos` existe

2. **Si le bucket n'existe pas, créez-le :**
   - Cliquez sur **New bucket**
   - Nom : `incident-photos`
   - **Public bucket** : ✅ Activé (pour permettre l'accès aux images)
   - **File size limit** : 5 MB
   - **Allowed MIME types** : `image/jpeg`, `image/png`, `image/webp`

#### Vérification Automatique :

Le bucket sera créé automatiquement lors du premier upload de photo, mais il est recommandé de le créer manuellement pour éviter les erreurs.

### 4. Configurer les Numéros WhatsApp

Chaque club doit avoir un numéro WhatsApp configuré dans la table `clubs`.

#### Vérification :

```sql
SELECT id, nom, whatsapp_number 
FROM clubs 
WHERE whatsapp_number IS NULL OR whatsapp_number = '';
```

#### Configuration :

```sql
-- Mettre à jour le numéro WhatsApp d'un club
UPDATE clubs 
SET whatsapp_number = '+33612345678'  -- Format international avec +
WHERE id = 'votre-club-id';
```

**Format du numéro :**
- Format international : `+33612345678` (avec le +)
- Format Twilio : `whatsapp:+33612345678` (sera géré automatiquement)

### 5. Vérifier les Parcours Actifs

Assurez-vous qu'au moins un parcours est actif pour chaque club :

```sql
SELECT c.name AS parcours, cl.nom AS club, c.hole_count, c.is_active
FROM courses c
JOIN clubs cl ON c.club_id = cl.id
WHERE c.is_active = true;
```

Si aucun parcours n'est actif, activez-en au moins un :

```sql
UPDATE courses 
SET is_active = true 
WHERE id = 'votre-parcours-id';
```

### 6. Vérifier les Variables d'Environnement

Assurez-vous que ces variables sont configurées dans votre `.env.local` :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key

# Twilio (optionnel pour la validation de signature)
TWILIO_AUTH_TOKEN=votre-auth-token
```

**Important :** `SUPABASE_SERVICE_ROLE_KEY` est nécessaire pour :
- Créer le bucket Storage automatiquement
- Uploader les photos depuis le webhook

### 7. Test de Connexion

Testez que votre application peut se connecter à Supabase :

```sql
-- Dans l'éditeur SQL de Supabase, exécutez :
SELECT COUNT(*) as total_clubs FROM clubs;
SELECT COUNT(*) as total_courses FROM courses WHERE is_active = true;
SELECT COUNT(*) as total_incidents FROM incidents;
```

### 8. Activer Supabase Realtime (IMPORTANT)

Le Realtime permet au dashboard de se mettre à jour automatiquement lorsqu'un nouvel incident est créé via WhatsApp.

#### Activation dans Supabase :

1. **Dans le Dashboard Supabase**
   - Allez dans **Database** > **Replication** (ou **Realtime** selon la version)
   - Trouvez la table `incidents` dans la liste
   - Activez le toggle **Realtime** pour la table `incidents`
   - ✅ La table doit être cochée pour activer les mises à jour en temps réel

2. **Vérification via SQL (Alternative)**

   Si l'interface graphique n'est pas disponible, vous pouvez activer le Realtime via SQL :

   ```sql
   -- Activer Realtime pour la table incidents
   ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
   ```

   Pour vérifier que c'est activé :

   ```sql
   -- Vérifier les tables activées pour Realtime
   SELECT 
     schemaname,
     tablename
   FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime';
   ```

   Vous devriez voir `incidents` dans la liste.

#### Pourquoi c'est important :

- ✅ **Sans Realtime** : Le dashboard ne se met pas à jour automatiquement. Il faut rafraîchir la page manuellement.
- ✅ **Avec Realtime** : Dès qu'un signalement WhatsApp arrive, il apparaît instantanément sur le dashboard sans rafraîchissement.

#### Note sur les autres tables :

- `chat_sessions` : Pas besoin de Realtime (utilisée uniquement par le webhook)
- `courses` : Pas besoin de Realtime (changements rares)
- `clubs` : Pas besoin de Realtime (changements rares)

### 9. Test du Webhook (Optionnel)

Pour tester le webhook localement avec ngrok :

1. **Démarrer votre serveur Next.js :**
   ```bash
   npm run dev
   ```

2. **Créer un tunnel ngrok :**
   ```bash
   ngrok http 3000
   ```

3. **Configurer Twilio :**
   - Dans la console Twilio, allez dans **Messaging** > **WhatsApp Senders**
   - Configurez le webhook : `https://votre-url-ngrok.ngrok.io/api/webhook/whatsapp`
   - Méthode : **POST**

4. **Envoyer un message de test :**
   - Envoyez "Bonjour" au numéro WhatsApp configuré
   - Vérifiez les logs de votre serveur Next.js

## 🐛 Résolution des Problèmes Courants

### Erreur : "Club non trouvé pour le numéro"

**Cause :** Le numéro WhatsApp dans la table `clubs` ne correspond pas au format envoyé par Twilio.

**Solution :**
1. Vérifiez le format du numéro dans `clubs.whatsapp_number`
2. Twilio envoie le numéro au format `whatsapp:+33612345678`
3. Le code gère automatiquement les formats, mais assurez-vous que le numéro est stocké au format international : `+33612345678`

### Erreur : "Aucun parcours configuré"

**Cause :** Aucun parcours n'est actif pour le club.

**Solution :**
```sql
-- Activer un parcours
UPDATE courses 
SET is_active = true 
WHERE club_id = 'votre-club-id';
```

### Erreur : "Storage upload failed"

**Cause :** Le bucket `incident-photos` n'existe pas ou les permissions sont incorrectes.

**Solution :**
1. Créez le bucket manuellement dans Supabase Dashboard > Storage
2. Assurez-vous qu'il est **Public**
3. Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est correctement configuré

### Erreur : "Session non trouvée"

**Cause :** La table `chat_sessions` n'existe pas.

**Solution :**
Exécutez `supabase/migration-chat-sessions.sql` dans l'éditeur SQL de Supabase.

## ✅ Checklist Finale

Avant de mettre en production, vérifiez :

- [ ] Toutes les tables existent (clubs, courses, incidents, chat_sessions)
- [ ] Le bucket `incident-photos` existe et est public
- [ ] Au moins un club a un `whatsapp_number` configuré
- [ ] Au moins un parcours est actif (`is_active = true`)
- [ ] **Realtime est activé pour la table `incidents`** ⚠️ IMPORTANT
- [ ] Les variables d'environnement Supabase sont configurées
- [ ] Le webhook Twilio pointe vers la bonne URL
- [ ] Le script de vérification SQL s'exécute sans erreur

## 📞 Support

Si vous rencontrez des problèmes, vérifiez :
1. Les logs de votre serveur Next.js
2. Les logs de Supabase (Dashboard > Logs)
3. Les logs de Twilio (Console > Monitor > Logs)

---

**Dernière mise à jour :** 2025-01-06

