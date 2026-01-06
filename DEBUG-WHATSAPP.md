# 🐛 Guide de Débogage WhatsApp

## Problème : "Je ne reçois aucune réponse sur WhatsApp"

### ✅ Checklist de diagnostic

#### 1. Vérifier la configuration Twilio

1. **Console Twilio** → **Messaging** → **WhatsApp Senders**
2. Vérifiez que votre numéro WhatsApp est actif
3. Vérifiez l'URL du webhook :
   ```
   https://votre-domaine.vercel.app/api/webhook/whatsapp
   ```
4. Méthode : **POST**
5. Format : **HTTP POST (application/x-www-form-urlencoded)**

#### 2. Vérifier le numéro WhatsApp dans la base de données

**Le problème le plus courant :** Le format du numéro dans Twilio ne correspond pas à celui dans Supabase.

**Format Twilio :** `whatsapp:+33612345678` ou `+33612345678`
**Format à stocker dans Supabase :** `+33612345678` (sans le préfixe `whatsapp:`)

**Solution :**
1. Allez dans **Paramètres** → **WhatsApp** dans GreenLog OS
2. Entrez le numéro au format : `+33612345678` (avec le `+` et l'indicatif pays)
3. Sauvegardez

**Vérification SQL :**
```sql
SELECT id, nom, whatsapp_number FROM clubs;
```

#### 3. Vérifier les logs Vercel

1. Allez dans **Vercel Dashboard** → Votre projet → **Deployments** → Dernier déploiement
2. Cliquez sur **Functions** → `/api/webhook/whatsapp`
3. Vérifiez les logs pour :
   - `[WhatsApp Webhook] Message reçu:` - Confirme que le webhook est appelé
   - `[WhatsApp Webhook] Club non trouvé` - Le numéro ne correspond pas
   - `[WhatsApp Webhook] Erreur serveur` - Erreur dans le code

#### 4. Tester le webhook manuellement

**Test avec curl :**
```bash
curl -X POST https://votre-domaine.vercel.app/api/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+33612345678&Body=Hello"
```

**Réponse attendue :**
- Si le numéro est configuré : Message de bienvenue
- Si le numéro n'est pas configuré : "❌ Numéro non autorisé"

#### 5. Vérifier les variables d'environnement

Dans **Vercel** → **Settings** → **Environment Variables**, vérifiez :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_AUTH_TOKEN` (optionnel)

#### 6. Vérifier la table chat_sessions

Assurez-vous que la migration SQL a été exécutée :
```sql
-- Vérifier que la table existe
SELECT * FROM chat_sessions LIMIT 1;
```

Si la table n'existe pas, exécutez `supabase/migration-chat-sessions.sql`

### 🔍 Scénarios courants

#### Scénario 1 : Le webhook n'est jamais appelé

**Symptômes :** Aucun log dans Vercel

**Solutions :**
1. Vérifiez l'URL du webhook dans Twilio
2. Vérifiez que le numéro WhatsApp est actif dans Twilio
3. Testez avec un message depuis WhatsApp

#### Scénario 2 : "Numéro non autorisé"

**Symptômes :** Logs montrent `[WhatsApp Webhook] Club non trouvé`

**Solutions :**
1. Vérifiez le format du numéro dans Supabase (doit correspondre exactement)
2. Twilio envoie souvent `whatsapp:+33...`, le code essaie de normaliser mais vérifiez quand même
3. Mettez à jour le numéro dans **Paramètres** → **WhatsApp**

#### Scénario 3 : Erreur 500

**Symptômes :** Logs montrent `[WhatsApp Webhook] Erreur serveur`

**Solutions :**
1. Vérifiez les logs complets dans Vercel
2. Vérifiez que la table `chat_sessions` existe
3. Vérifiez que les parcours existent dans la table `courses`

### 📝 Format des numéros

**Format Twilio :** `whatsapp:+33612345678`
**Format à stocker :** `+33612345678`

**Normalisation automatique :**
Le code essaie automatiquement de normaliser :
- `whatsapp:+33612345678` → `+33612345678`
- `+33612345678` → `+33612345678`

### 🧪 Test complet

1. **Envoyer un message WhatsApp** : "Hello"
2. **Vérifier les logs Vercel** : Doit afficher `[WhatsApp Webhook] Message reçu`
3. **Vérifier la réponse** : Doit recevoir "Bonjour ! Sur quel parcours es-tu ?"

### 🆘 Si rien ne fonctionne

1. Vérifiez que le déploiement Vercel est récent (après les modifications)
2. Vérifiez que toutes les migrations SQL sont exécutées
3. Contactez le support avec les logs Vercel complets


