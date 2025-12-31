# 🚀 Déploiement sur Vercel - Guide Simple

## Méthode la plus simple : Via l'interface Vercel (Recommandé)

### Étape 1 : Préparer votre code
1. **Commit et push sur GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

### Étape 2 : Connecter Vercel à votre repo
1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous avec GitHub/GitLab/Bitbucket
3. Cliquez sur **"Add New Project"**
4. Sélectionnez votre repository `GreenLog`
5. Vercel détecte automatiquement Next.js ✅

### Étape 3 : Configurer les variables d'environnement
Dans la section **"Environment Variables"**, ajoutez :

```
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
TWILIO_AUTH_TOKEN=votre_twilio_auth_token
```

⚠️ **Important :** Ne mettez JAMAIS ces valeurs dans le code ! Utilisez uniquement les variables d'environnement.

### Étape 4 : Déployer
1. Cliquez sur **"Deploy"**
2. Attendez 2-3 minutes
3. Votre app est en ligne ! 🎉

### Étape 5 : Configurer le webhook WhatsApp
1. Copiez l'URL de votre déploiement : `https://votre-projet.vercel.app`
2. Dans Twilio, configurez le webhook :
   - URL : `https://votre-projet.vercel.app/api/webhook/whatsapp`
   - Méthode : POST

---

## Méthode alternative : Via CLI Vercel

Si vous préférez la ligne de commande :

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer (première fois)
vercel

# Déployer en production
vercel --prod
```

Les variables d'environnement peuvent être ajoutées via :
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
# etc...
```

---

## ✅ Checklist avant déploiement

- [ ] Migration SQL exécutée dans Supabase (`migration-chat-sessions.sql`)
- [ ] Variables d'environnement prêtes
- [ ] Code commité et pushé
- [ ] `.env.local` dans `.gitignore` (ne pas commiter les secrets !)
- [ ] Test local : `npm run build` fonctionne sans erreur

---

## 🔧 Après le déploiement

### Vérifier que tout fonctionne :
1. **Dashboard :** `https://votre-projet.vercel.app`
2. **Webhook :** Testez en envoyant un message WhatsApp
3. **Logs :** Vérifiez les logs dans Vercel Dashboard → Deployments → Functions

### Si problème :
- Vérifiez les logs dans Vercel Dashboard
- Vérifiez que toutes les variables d'environnement sont bien configurées
- Vérifiez que la migration SQL a été exécutée

---

## 📝 Notes importantes

1. **Domaine personnalisé :** Vous pouvez ajouter un domaine dans Vercel → Settings → Domains
2. **Variables d'environnement :** Elles sont différentes pour Preview et Production
3. **Build automatique :** Chaque push sur `main` déclenche un nouveau déploiement
4. **Rollback :** Vous pouvez revenir à une version précédente dans Vercel Dashboard

---

## 🆘 Support

- Documentation Vercel : [vercel.com/docs](https://vercel.com/docs)
- Support Vercel : [vercel.com/support](https://vercel.com/support)

