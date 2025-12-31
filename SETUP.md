# 🚀 Guide de Configuration - GreenLog OS

## Prérequis

- Node.js 18+ et npm
- Compte Supabase
- PostgreSQL (via Supabase)

## Étapes d'installation

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Récupérez vos clés API :
   - `URL` : URL de votre projet
   - `anon key` : Clé publique anonyme
   - `service_role key` : Clé de service (à garder secrète)

### 3. Configuration de la base de données

**Option A : Base de données vierge (recommandé)**

1. Allez dans l'éditeur SQL de Supabase
2. Copiez le contenu de `supabase/schema-complete.sql`
3. Exécutez le script SQL pour créer toutes les tables

**Option B : Si vous avez déjà créé la table incidents**

1. Allez dans l'éditeur SQL de Supabase
2. Copiez le contenu de `supabase/migration-add-courses.sql`
3. Exécutez le script de migration pour ajouter la table courses

### 4. Configuration des variables d'environnement

Créez un fichier `.env.local` à la racine (recommandé par Next.js pour les variables locales) :

```bash
cp env.example.txt .env.local
```

Puis remplissez les valeurs :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

### 5. Activer Realtime sur Supabase

1. Allez dans **Database** > **Replication**
2. Activez la réplication pour la table `incidents`
3. Ou exécutez dans l'éditeur SQL :

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
```

### 6. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## 🧪 Test de l'application

1. **Tester le simulateur** : Cliquez sur "Simuler Signalement WhatsApp" pour créer un incident de test
2. **Tester la résolution** : Cliquez sur "Marquer comme résolu" - vous devriez voir des confettis !
3. **Tester les filtres** : Cliquez sur les numéros de trous ou les catégories pour filtrer
4. **Tester le temps réel** : Ouvrez deux onglets, créez un incident dans un, il apparaît dans l'autre instantanément

## 🔧 Dépannage

### Erreur : "relation does not exist"

→ La base de données n'a pas été créée. Exécutez le script SQL dans Supabase (`supabase/schema.sql`).

### Erreur : "Realtime not working"

→ Vérifiez que vous avez activé Realtime pour la table `incidents` dans Supabase.

### Erreur : "Cannot find module"

→ Exécutez `npm install` pour installer les dépendances.

### Types TypeScript manquants

→ Les types sont définis dans `lib/types.ts`. Vérifiez que le fichier existe.

## 📝 Prochaines étapes

- [ ] Implémenter l'authentification Supabase
- [ ] Remplacer `club_id` hardcodé par authentification
- [ ] Configurer Row Level Security (RLS) dans Supabase
- [ ] Implémenter la logique Twilio dans `/api/webhook/whatsapp`
- [ ] Ajouter des tests

## 🆘 Support

Pour toute question, consultez :
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)

