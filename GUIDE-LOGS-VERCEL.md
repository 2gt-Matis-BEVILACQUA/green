# 📊 Guide : Voir les Logs sur Vercel

## 🔍 Où trouver les logs sur Vercel

### Méthode 1 : Logs en temps réel (Recommandé)

1. **Allez dans votre Dashboard Vercel**
   - [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Sélectionnez votre projet

2. **Onglet "Logs"**
   - Cliquez sur **"Logs"** dans le menu de gauche
   - Vous verrez tous les logs en temps réel de votre application

3. **Filtrer par fonction**
   - Utilisez le filtre en haut pour sélectionner une fonction spécifique
   - Exemple : `/api/webhook/whatsapp`

### Méthode 2 : Logs d'une fonction spécifique

1. **Allez dans "Deployments"**
   - Cliquez sur **"Deployments"** dans le menu
   - Sélectionnez votre dernier déploiement

2. **Onglet "Functions"**
   - Cliquez sur l'onglet **"Functions"**
   - Trouvez votre fonction (ex: `/api/webhook/whatsapp`)
   - Cliquez dessus pour voir les logs de cette fonction

3. **Onglet "Logs" dans la fonction**
   - Une fois dans la fonction, cliquez sur l'onglet **"Logs"**
   - Vous verrez tous les `console.log` et `console.error` de cette fonction

### Méthode 3 : Logs via l'API Vercel (Avancé)

Si vous voulez accéder aux logs programmatiquement :

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Voir les logs
vercel logs [votre-projet] --follow
```

## 🐛 Pourquoi je ne vois pas les logs ?

### Problème 1 : Les logs n'apparaissent pas immédiatement

**Solution :**
- Attendez 10-30 secondes après l'exécution de votre fonction
- Les logs peuvent prendre quelques secondes à apparaître
- Rafraîchissez la page si nécessaire

### Problème 2 : Les logs sont filtrés

**Solution :**
1. Vérifiez les filtres en haut de la page des logs
2. Assurez-vous que le filtre de niveau est sur **"All"** ou **"Info"**
3. Vérifiez que le filtre de fonction inclut votre route API

### Problème 3 : La fonction n'est pas appelée

**Solution :**
1. Vérifiez que votre webhook Twilio pointe vers la bonne URL
2. Testez manuellement votre endpoint :
   ```bash
   curl -X POST https://votre-domaine.vercel.app/api/webhook/whatsapp \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "From=whatsapp:+33612345678&Body=Test"
   ```
3. Vérifiez les logs après l'appel

### Problème 4 : Les logs sont dans une autre section

**Solution :**
- Les logs de **build** sont dans "Deployments" > "Build Logs"
- Les logs de **runtime** sont dans "Logs" ou "Functions" > "Logs"
- Les logs d'**erreurs** peuvent être dans "Deployments" > "Function Logs"

## 📝 Types de logs dans votre application

### Logs du Webhook WhatsApp

Votre code génère ces logs dans `/api/webhook/whatsapp` :

```typescript
// Log d'information
console.log("[WhatsApp Webhook] Message reçu:", {
  from: fromNumber,
  body: messageBody,
  hasMedia: !!mediaUrl,
})

// Logs d'erreur
console.error("[WhatsApp Webhook] Club non trouvé pour le numéro:", fromNumber)
console.error("[WhatsApp Webhook] Erreur Supabase:", clubError)
console.error("Error creating incident:", insertError)
console.error("Webhook error:", error)
```

### Où les voir :

1. **Logs normaux** : `console.log` → Section "Logs" > Niveau "Info"
2. **Logs d'erreur** : `console.error` → Section "Logs" > Niveau "Error"

## 🔧 Améliorer la visibilité des logs

### Ajouter plus de logs (Optionnel)

Si vous voulez plus de détails, vous pouvez ajouter des logs supplémentaires :

```typescript
// Dans app/api/webhook/whatsapp/route.ts
console.log("[WhatsApp Webhook] Début du traitement")
console.log("[WhatsApp Webhook] Session:", session?.id)
console.log("[WhatsApp Webhook] Dialog result:", dialogResult)
console.log("[WhatsApp Webhook] Incident créé:", incident?.id)
```

### Utiliser des niveaux de log différents

```typescript
// Info (niveau normal)
console.log("[INFO] Message reçu")

// Warning (attention)
console.warn("[WARN] Numéro non trouvé, tentative alternative")

// Error (erreur)
console.error("[ERROR] Erreur serveur:", error)
```

## 📊 Vérification rapide

### Checklist pour voir les logs :

- [ ] Vous êtes connecté à votre compte Vercel
- [ ] Vous avez sélectionné le bon projet
- [ ] Vous êtes dans l'onglet "Logs" ou "Functions" > "Logs"
- [ ] Les filtres sont correctement configurés (niveau "All")
- [ ] Vous avez déclenché une action récemment (webhook, API call)
- [ ] Vous avez attendu 10-30 secondes après l'action

## 🚀 Test rapide

Pour tester que les logs fonctionnent :

1. **Appelez votre endpoint de test :**
   ```bash
   curl https://votre-domaine.vercel.app/api/webhook/whatsapp
   ```

2. **Vérifiez les logs immédiatement :**
   - Allez dans Vercel > Logs
   - Vous devriez voir le log du `GET` handler

3. **Si vous ne voyez rien :**
   - Vérifiez que vous êtes sur le bon environnement (Production/Preview)
   - Vérifiez que le déploiement est actif
   - Attendez quelques secondes et rafraîchissez

## 💡 Astuce : Logs en temps réel

Pour voir les logs en temps réel pendant le développement :

1. **Utilisez Vercel CLI en local :**
   ```bash
   vercel dev
   ```
   Les logs apparaîtront dans votre terminal

2. **Ou utilisez les logs Vercel avec follow :**
   ```bash
   vercel logs [projet] --follow
   ```

## 📞 Support

Si vous ne voyez toujours pas les logs :

1. Vérifiez que votre fonction est bien déployée
2. Vérifiez que les variables d'environnement sont configurées
3. Vérifiez les logs de build pour voir s'il y a des erreurs
4. Contactez le support Vercel si le problème persiste

---

**Note :** Les logs sont conservés pendant 7 jours sur le plan gratuit de Vercel, et plus longtemps sur les plans payants.

