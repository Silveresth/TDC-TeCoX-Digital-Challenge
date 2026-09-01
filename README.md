# 🏆 TDC — TeCoX Digital Challenge 2026

Plateforme web officielle de gestion, passation d'épreuves, calcul automatique des performances et classement en direct pour le **TeCoX Digital Challenge (TDC)**, organisée par **TeCoX — Tech Community eXperience**.

---

## 🎨 Identité Visuelle & Design
- **Identité officielle TeCoX** : Respect strict du logo officiel TeCoX, des proportions et des couleurs de marque (*Bleu Nuit Tech `#082F6A`*, *Cyan Électrique `#00D2BA`*, typographie moderne et contrastes nets).
- **Design Moderne & Épuré** : Interface épurée, sans dégradés criards, basée sur des standards visuels contemporains (cartes aux bordures subtiles, badges clairs, mode sombre / clair fluide).
- **100% Responsive** : Expérience fluide et optimisée sur ordinateur, tablette et smartphone.

---

## 🚀 Fonctionnalités Clés

### 👤 1. Espace Participant
- Tableau de bord personnalisé avec score cumulé, taux de progression, temps total et rang en direct.
- Accès aux **8 épreuves officielles** :
  1. 💻 *Découverte de l'informatique* (100 pts)
  2. 📱 *Téléphone portable & Smartphone* (100 pts)
  3. 🖥️ *Ordinateur & Périphériques* (100 pts)
  4. 🪟 *Système d'exploitation Windows* (150 pts)
  5. 📝 *Microsoft Word — Traitement de texte* (150 pts avec mission pratique)
  6. 📊 *Microsoft Excel — Tableur & Formules* (150 pts avec mission pratique)
  7. 🎞️ *Microsoft PowerPoint — Présentations Dynamiques* (150 pts avec mission pratique)
  8. 🏆 *Grand Challenge TDC — Finale Compétition* (200 pts)
- **Environnement d'examen sécurisé** : Chronomètre synchronisé côté serveur avec auto-soumission, sauvegarde automatique en continu, support des QCM (uniques et multiples), Vrai/Faux, réponses courtes, numériques et **dépôt de fichiers pour missions pratiques** (`.docx`, `.xlsx`, `.pptx`, `.pdf`, `.zip`).
- Historique complet des tentatives avec retours et commentaires personnalisés du jury.

### 👨‍💼 2. Espace Administrateur & Jury
- **Dashboard de supervision** : KPIs en direct (participants connectés, tentatives, score moyen, épreuve la plus difficile / plus facile).
- **Gestion des participants** : Ajout manuel, modification, réinitialisation de mot de passe, activation/désactivation, et **importation en masse par fichier CSV**.
- **Gestionnaire d'épreuves & questions** : Création et modification d'épreuves, configuration des barèmes et coefficients, éditeur visuel de questions avec options de réponses.
- **Pôle de corrections manuelles (Missions pratiques)** : Téléchargement direct des fichiers rendus par les candidats, attribution de notes sur barème et ajout d'appréciations jury avec recalcul instantané.
- **Contrôle du classement** : Activation ou masquage temporaire du classement public pour les participants.
- **Journal d'audit (Audit Logs)** : Journalisation en temps réel de tous les événements système (connexions, lancements d'épreuves, soumissions, notations).
- **Exportation des résultats** : Génération en un clic du rapport officiel **Microsoft Excel (.xlsx)** avec mise en page stylisée et du fichier **CSV**.

### 🏅 3. Classement & Palmarès
- Podium en direct (🥇 Or, 🥈 Argent, 🥉 Bronze) avec départage automatisé (score prioritaire, temps cumulé en cas d'égalité).
- Filtres par épreuve individuelle et par équipe/groupe.
- Page spéciale de clôture et proclamation du **Grand Champion TDC 2026** avec animation festive.

---

## 📁 Structure du Projet

```
TDC-TeCoX-Digital-Challenge/
├── backend/                  # API REST Django & Django REST Framework
│   ├── apps/
│   │   ├── authentication/   # Utilisateurs (TdcUser), rôles, JWT auth
│   │   ├── competitions/     # Épreuves (Trial), Questions, Choix (Option)
│   │   ├── attempts/         # Tentatives (Attempt), Réponses (Answer), Moteur de notation
│   │   └── analytics/        # Classement, Stats, AuditLog, Exportateurs Excel/CSV
│   ├── tdc_backend/          # Configuration Django (settings, urls, wsgi, asgi)
│   ├── scripts/              # Script de peuplement de la BDD (seed_tdc_data.py)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # Application Next.js 14 (App Router) + TypeScript + Tailwind
│   ├── public/               # Logos officiels TeCoX, favicon et assets
│   ├── src/
│   │   ├── app/              # Routes Next.js (Dashboard, Exam, Leaderboard, Admin...)
│   │   ├── components/       # Composants modulaires (ui, layout, trials, charts)
│   │   ├── context/          # AuthContext, NotificationContext, ThemeContext
│   │   ├── lib/              # Client API Axios, utilitaires, formatage
│   │   └── types/            # Interfaces TypeScript
│   ├── Dockerfile
│   └── package.json
├── nginx/                    # Configuration Reverse Proxy Nginx (Port 80)
│   ├── nginx.conf
│   └── default.conf
├── docker-compose.yml        # Orchestration multi-conteneurs (PostgreSQL, Django, Next.js, Nginx)
├── .env.example              # Variables d'environnement
├── scripts/                  # Scripts de lancement local, backup et restauration BDD
│   ├── start_dev.bat         # Lanceur Windows en un clic
│   ├── start_dev.sh          # Lanceur Linux/Mac
│   ├── backup_database.sh    # Sauvegarde BDD PostgreSQL
│   └── restore_database.sh   # Restauration BDD PostgreSQL
└── docs/                     # Documentation complète
    ├── UBUNTU_DEPLOYMENT.md  # Guide de déploiement pas à pas sur Ubuntu Server
    ├── NETWORK_MIKROTIK.md   # Guide d'intégration réseau local sans toucher au MikroTik
    ├── ARCHITECTURE.md       # Architecture technique, modèles et formules
    └── API_DOCUMENTATION.md  # Documentation des endpoints REST
```

---

## ⚡ Démarrage Rapide

### Option 1 : Déploiement en Production avec Docker (Recommandé)

Sur Ubuntu Server ou toute machine avec Docker :
```bash
# 1. Cloner le dépôt et copier la configuration
cp .env.example .env

# 2. Lancer tous les conteneurs en tâche de fond
docker compose up -d --build

# 3. L'application est immédiatement accessible sur http://IP_DU_SERVEUR
```

### Option 2 : Développement Local (Sans Docker)

#### 1. Lancer le Backend Django
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python scripts/seed_tdc_data.py
python manage.py runserver 0.0.0.0:8000
```

#### 2. Lancer le Frontend Next.js
```bash
cd frontend
npm install
npm run dev
```

Accédez à `http://localhost:3000`.

---

## 🔑 Identifiants d'Accès par Défaut

| Rôle | Identifiant / Code | Mot de passe | Description |
|---|---|---|---|
| **Administrateur** | `admin` (ou `admin@tecox.org`) | `Admin@TDC2026!` | Accès complet au panneau de gestion TDC |
| **Jury / Formateur** | `jury` (ou `jury@tecox.org`) | `Jury@TDC2026!` | Évaluation et correction des missions |
| **Participant Démo** | `TDC-2026-001` (ou `eloge.gomina`) | `Tdc2026!` | Compte de test participant Éloge Gomina |
| **Autre Participant** | `TDC-2026-002` (ou `marie.akpalo`) | `Tdc2026!` | Compte de test participant Marie Akpalo |

---

## 📚 Documentation Complète
- [Guide de Déploiement Ubuntu Server](docs/UBUNTU_DEPLOYMENT.md)
- [Intégration Réseau Local & MikroTik](docs/NETWORK_MIKROTIK.md)
- [Architecture & Barèmes](docs/ARCHITECTURE.md)
- [Catalogue des Endpoints API](docs/API_DOCUMENTATION.md)
