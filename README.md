# 🚀 GreenLog OS - Dashboard de Maintenance Golf

Plateforme SaaS de gestion d'incidents pour les golfs du groupe Résonance. Built with Next.js 15, TypeScript, Tailwind CSS, Shadcn/UI, and Supabase.

## ✨ Fonctionnalités

- 📊 **Dashboard en temps réel** avec mise à jour instantanée via Supabase Realtime
- 🎯 **Gestion d'incidents** : signalement, suivi, résolution
- 📸 **Mode photo full-screen** avec zoom
- 🔍 **Filtres interactifs** par trou (1-18) et par catégorie
- 📈 **Statistiques en direct** : incidents actifs, urgences, taux de résolution
- 🎉 **Confettis** lors de la résolution d'un incident
- 🔔 **Webhook WhatsApp** prêt pour intégration Twilio

## 🏗️ Architecture

### Base de données (Supabase)

```
clubs
├── id (uuid)
├── nom (string)
├── adresse (string?)
├── logo (string?)
├── whatsapp_number (string?)
└── api_key (string?)

incidents
├── id (uuid)
├── created_at (datetime)
├── club_id (uuid) → clubs.id
├── hole_number (int: 1-18)
├── category (enum: Arrosage, Tonte, Bunker, Signalétique, Autre)
├── description (string?)
├── photo_url (string?)
├── priority (enum: Low, Medium, High, Critical)
├── status (enum: Open, In_Progress, Resolved)
├── reported_by (string? - phone_number)
└── resolved_at (datetime?)
```

### Design System

- **Couleurs** :
  - Vert Émeraude Profond (#065F46) - Golf
  - Ambre (#F59E0B) - Moyen
  - Rouge Corail (#EF4444) - Urgent
- **Typographie** : Inter (Google Fonts)
- **Style** : Apple x Stripe - Fond gris clair (#F9FAFB), cartes blanches

## 🚀 Installation

1. **Cloner le projet**
   ```bash
   git clone <repo-url>
   cd GreenLog
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp env.example.txt .env.local
   ```
   
   **Note** : Utilisez `.env.local` pour les variables locales (recommandé par Next.js)
   
   Remplir les valeurs dans `.env` :
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://..."
   NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
   SUPABASE_SERVICE_ROLE_KEY="..."
   ```

4. **Créer les tables dans Supabase**
   
   Allez dans l'éditeur SQL de Supabase et exécutez le script `supabase/schema.sql`

5. **Activer Realtime**
   
   Dans Supabase : Database > Replication > Activer pour la table `incidents`

6. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

   Ouvrir [http://localhost:3000](http://localhost:3000)

## 📝 Utilisation

### Dashboard

- **Vue Live** : Page principale avec flux d'incidents en temps réel
- **Historique** : À implémenter
- **Paramètres** : À implémenter

### Simulateur de Webhook

Utilisez le bouton "Simuler Signalement WhatsApp" en haut à droite du dashboard pour créer un incident de démonstration.

### Webhook WhatsApp

Endpoint : `POST /api/webhook/whatsapp`

Payload attendu :
```json
{
  "club_id": "uuid",
  "hole_number": 5,
  "category": "Arrosage",
  "description": "Problème d'arrosage sur le trou 5",
  "photo_url": "https://...",
  "priority": "Medium",
  "reported_by": "+33612345678"
}
```

**Note** : Vous devez implémenter la logique de parsing du message Twilio WhatsApp dans ce endpoint.

## 🛠️ Technologies

- **Framework** : Next.js 15 (App Router)
- **Language** : TypeScript
- **Styling** : Tailwind CSS
- **UI Components** : Shadcn/UI (Radix UI)
- **Database** : Supabase (PostgreSQL) - Direct API
- **Realtime** : Supabase Realtime Subscriptions
- **Icons** : Lucide React
- **Animations** : Canvas Confetti

## 📁 Structure du projet

```
GreenLog/
├── app/
│   ├── api/
│   │   ├── incidents/
│   │   ├── stats/
│   │   ├── simulate/
│   │   └── webhook/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── dashboard/
│   │   ├── sidebar.tsx
│   │   ├── stats-card.tsx
│   │   ├── incident-card.tsx
│   │   ├── hole-filter.tsx
│   │   └── category-filter.tsx
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── dialog.tsx
│       └── ...
├── lib/
│   ├── supabase/
│   ├── types.ts
│   └── utils.ts
├── supabase/
│   └── schema.sql
└── ...
```

## 🔒 Sécurité

- ⚠️ **TODO** : Implémenter l'authentification (Supabase Auth)
- ⚠️ **TODO** : Ajouter la vérification de signature Twilio dans le webhook
- ⚠️ **TODO** : Remplacer `club_id` hardcodé par récupération depuis la session utilisateur

## 📈 Prochaines étapes

- [ ] Implémenter l'authentification multi-clubs
- [ ] Page Historique avec filtres avancés
- [ ] Page Paramètres du club
- [ ] Notifications push
- [ ] Export de rapports
- [ ] Graphiques et analytics avancés

## 📄 Licence

Propriétaire - Groupe Résonance

