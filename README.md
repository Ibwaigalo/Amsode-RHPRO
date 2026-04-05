# 🏢 AMSODE RH PRO — Plateforme de Gestion RH

> Système intégré de gestion des ressources humaines, conçu pour les organisations comme AMSODE au Mali.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-green)
![Neon](https://img.shields.io/badge/Neon-Postgres-teal?logo=postgresql)
![Vercel](https://img.shields.io/badge/Déploiement-Vercel-black?logo=vercel)

---

## 📋 Table des matières
1. [Fonctionnalités](#fonctionnalités)
2. [Architecture technique](#architecture)
3. [Prérequis](#prérequis)
4. [Installation locale](#installation-locale)
5. [Configuration Neon (base de données)](#neon)
6. [Variables d'environnement](#variables)
7. [Déploiement Vercel](#vercel)
8. [Seed — Données de démonstration](#seed)
9. [Tests](#tests)
10. [RBAC — Rôles et permissions](#rbac)
11. [Sécurité](#sécurité)

---

## ✅ Fonctionnalités

| Module | Fonctionnalités |
|--------|----------------|
| 👥 **Employés** | CRUD complet, photo, CIN, historique audité, filtres avancés |
| 🎯 **Recrutement** | Job board interne, candidatures, workflow onboarding |
| 💰 **Paie** | Calcul CNSS Mali + IRG, bulletins PDF, exports Excel, simulateur |
| 📅 **Congés** | Demandes, validation multi-niveaux, calendrier, soldes |
| ⭐ **Performances** | Évaluations 360°, OKR, scores par critère |
| 🎓 **Formations** | Catalogue, inscriptions, certificats |
| 📁 **Documents** | Upload/stockage, alertes expiration, conformité |
| 📊 **Rapports** | Dashboards, exports Excel custom, analytiques RH |
| 🔔 **Notifications** | Temps réel via Pusher, emails Resend |

> ⛔ **Exclusions volontaires** : Aucune gestion des pointages, présences, clock-in/out ou horodateurs.

---

## 🏗 Architecture

```
amsode-rh-pro/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Pages de connexion
│   │   ├── dashboard/       # Toutes les pages métier
│   │   └── api/             # Routes API REST
│   ├── components/          # Composants React réutilisables
│   ├── lib/
│   │   ├── auth.ts          # NextAuth v5 + RBAC
│   │   ├── db.ts            # Connexion Neon/Drizzle
│   │   ├── payroll-engine.ts # Moteur de paie Mali
│   │   └── pdf-generator.ts  # Génération PDF bulletins
│   └── __tests__/           # Tests Jest
├── db/
│   ├── schema/index.ts      # Schéma complet Drizzle
│   ├── migrations/          # Migrations SQL auto-générées
│   └── seed.ts              # 10 employés de démonstration
└── ...
```

**Stack :**
- **Frontend** : Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Base de données** : Neon (Postgres serverless) + Drizzle ORM
- **Auth** : NextAuth v5 (credentials + Google OAuth) + RBAC
- **PDF** : pdf-lib (bulletins de salaire)
- **Excel** : xlsx (exports rapports)
- **Charts** : Recharts
- **Notifications** : Pusher Channels (plan gratuit)
- **Email** : Resend

---

## ⚡ Prérequis

- Node.js ≥ 18.17
- npm ≥ 9 ou pnpm ≥ 8
- Un compte [Neon](https://neon.tech) (gratuit)
- Un compte [Vercel](https://vercel.com) (gratuit)

---

## 🖥 Installation locale

```bash
# 1. Cloner le projet
git clone https://github.com/votre-org/amsode-rh-pro.git
cd amsode-rh-pro

# 2. Installer les dépendances
npm install

# 3. Copier les variables d'environnement
cp .env.example .env.local

# 4. Renseigner DATABASE_URL et NEXTAUTH_SECRET dans .env.local

# 5. Pousser le schéma Drizzle vers Neon
npm run db:push

# 6. Charger les données de démonstration
npm run db:seed

# 7. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

**Compte admin par défaut (après seed) :**
```
Email    : admin@amsode.ml
Password : Admin@2024
```

---

## 🗄 Configuration Neon (Base de données) {#neon}

### Étape 1 — Créer un projet Neon gratuit

1. Aller sur [console.neon.tech](https://console.neon.tech)
2. Cliquer **New Project**
3. Nommer le projet `amsode-rh-pro`
4. Choisir la région la plus proche (ex: `eu-west-2` pour l'Afrique de l'Ouest)
5. Copier la **Connection String** (format `postgresql://...`)

### Étape 2 — Configurer dans .env.local

```env
DATABASE_URL="postgresql://user:password@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require"
```

### Étape 3 — Pousser le schéma

```bash
# Crée toutes les tables en une commande
npm run db:push

# OU générer les migrations SQL d'abord
npm run db:generate
npm run db:migrate
```

### Étape 4 — Vérifier avec Drizzle Studio

```bash
npm run db:studio
# Ouvre un navigateur avec l'interface visuelle de la DB
```

---

## 🔐 Variables d'environnement {#variables}

Copiez `.env.example` → `.env.local` et renseignez :

| Variable | Description | Requis |
|----------|-------------|--------|
| `DATABASE_URL` | Connection string Neon | ✅ |
| `NEXTAUTH_SECRET` | Secret JWT (32+ chars) | ✅ |
| `NEXTAUTH_URL` | URL de l'app | ✅ |
| `GOOGLE_CLIENT_ID` | OAuth Google | Optionnel |
| `GOOGLE_CLIENT_SECRET` | OAuth Google | Optionnel |
| `RESEND_API_KEY` | Envoi d'emails | Optionnel |
| `PUSHER_*` | Notifications temps réel | Optionnel |

**Générer un NEXTAUTH_SECRET sécurisé :**
```bash
openssl rand -base64 32
```

---

## 🚀 Déploiement Vercel {#vercel}

### Option A — Deploy via interface Vercel

1. Push votre code sur GitHub
2. Aller sur [vercel.com/new](https://vercel.com/new)
3. Importer le dépôt GitHub
4. Dans **Environment Variables**, ajouter toutes les variables du `.env.example`
5. Cliquer **Deploy**

### Option B — Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Configurer les variables d'environnement
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Déployer en production
vercel --prod
```

### Post-déploiement

```bash
# Pousser le schéma vers Neon production
DATABASE_URL="votre-url-neon" npm run db:push

# Charger les données de test
DATABASE_URL="votre-url-neon" npm run db:seed
```

---

## 🌱 Seed — Données de démonstration {#seed}

Le script `db/seed.ts` crée automatiquement :

- **5 départements** : Direction, RH, Finance, Terrain, Communication
- **5 postes** avec fourchettes salariales
- **10 employés maliens** avec données réalistes (noms, CIN, salaires en FCFA)
- **1 compte Admin RH** : `admin@amsode.ml` / `Admin@2024`
- **3 demandes de congés** (approuvées + en attente)
- **1 offre d'emploi** active
- **Soldes de congés** pour 5 employés
- **Paramètres organisation** AMSODE

```bash
npm run db:seed
```

---

## 🧪 Tests {#tests}

```bash
# Lancer tous les tests
npm test

# Mode watch (développement)
npm run test:watch

# Avec couverture de code
npm test -- --coverage
```

**Tests inclus :**
- `payroll-engine.test.ts` — Moteur de calcul CNSS + IRG Mali (12 cas)
- `utils.test.ts` — Fonctions utilitaires (15 cas)

---

## 🔒 RBAC — Rôles et permissions {#rbac}

| Fonctionnalité | Admin RH | Manager | Employé |
|----------------|----------|---------|---------|
| Dashboard | ✅ | ✅ | ✅ |
| Voir employés | ✅ | ✅ | ✅ (son profil) |
| Créer/modifier employé | ✅ | ✅ | ❌ |
| Supprimer employé | ✅ | ❌ | ❌ |
| Accès paie/bulletins | ✅ | ✅ | ✅ (ses propres) |
| Générer paie | ✅ | ❌ | ❌ |
| Demande de congé | ✅ | ✅ | ✅ |
| Valider congés | ✅ | ✅ | ❌ |
| Créer évaluation | ✅ | ✅ | ❌ |
| Rapports & exports | ✅ | ✅ | ❌ |
| Paramètres org. | ✅ | ❌ | ❌ |

---

## 🛡 Sécurité {#sécurité}

- **Authentification** : JWT signé (NextAuth v5), sessions sécurisées
- **Autorisation** : RBAC enforced côté serveur sur toutes les routes API
- **Mots de passe** : Bcrypt (salt rounds: 12)
- **Audit trail** : Table `audit_logs` avec avant/après pour chaque modification
- **Headers HTTP** : X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- **Soft delete** : Les employés ne sont jamais supprimés physiquement
- **Variables** : Tous les secrets via `.env.local` — jamais dans le code

---

## 📱 PWA

L'application est installable en tant que Progressive Web App sur mobile (Android/iOS) grâce au `manifest.json`.

---

## 🌍 Internationalisation

Interface par défaut en **Français** (`fr-ML`). Ajout de l'anglais possible via `next-intl`.

---

## 📞 Support

Pour toute question ou contribution, ouvrez une issue sur GitHub.

**© 2024 AMSODE — Plateforme RH confidentielle**
