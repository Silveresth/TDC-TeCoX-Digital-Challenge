# Documentation de l'API REST — TDC 2026

Toutes les routes de l'API sont préfixées par `/api/`. L'authentification utilise des jetons **JWT (Bearer Token)** via l'en-tête `Authorization: Bearer <access_token>`.

---

## 🔐 1. Authentification (`/api/auth/`)

| Méthode | Endpoint | Description | Permissions |
|---|---|---|---|
| `POST` | `/api/auth/login/` | Connexion par identifiant/code et mot de passe | Public |
| `POST` | `/api/auth/refresh/` | Rafraîchissement du token JWT | Public |
| `GET` | `/api/auth/me/` | Récupération du profil de l'utilisateur connecté | Authentifié |
| `PATCH` | `/api/auth/me/` | Mise à jour de son profil (avatar, contact) | Authentifié |
| `POST` | `/api/auth/change-password/` | Changement de mot de passe sécurisé | Authentifié |
| `GET` | `/api/auth/participants/` | Liste paginée des participants avec filtres | Admin / Jury |
| `POST` | `/api/auth/participants/` | Création manuelle d'un participant | Admin |
| `POST` | `/api/auth/participants/import_csv/` | Importation en masse depuis un fichier CSV | Admin |
| `POST` | `/api/auth/participants/{id}/reset_password/` | Réinitialisation du mot de passe | Admin |
| `POST` | `/api/auth/participants/{id}/toggle_active/` | Activer ou désactiver un compte | Admin |

---

## 📚 2. Épreuves & Questions (`/api/competitions/`)

| Méthode | Endpoint | Description | Permissions |
|---|---|---|---|
| `GET` | `/api/competitions/trials/` | Liste des épreuves (filtrée selon le rôle) | Authentifié |
| `GET` | `/api/competitions/trials/{id}/` | Détails complets d'une épreuve | Authentifié |
| `POST` | `/api/competitions/trials/` | Création d'une épreuve | Admin |
| `PUT/PATCH`| `/api/competitions/trials/{id}/` | Modification d'une épreuve | Admin |
| `POST` | `/api/competitions/trials/{id}/set_status/` | Changement rapide de statut (OPEN, DRAFT...) | Admin |
| `POST` | `/api/competitions/questions/` | Création d'une question/mission avec barème | Admin |
| `PUT/PATCH`| `/api/competitions/questions/{id}/` | Mise à jour d'une question et de ses options | Admin |
| `DELETE` | `/api/competitions/questions/{id}/` | Suppression d'une question | Admin |

---

## 📝 3. Tentatives & Examens (`/api/attempts/`)

| Méthode | Endpoint | Description | Permissions |
|---|---|---|---|
| `POST` | `/api/attempts/start/{trial_id}/` | Démarrage ou reprise d'une épreuve avec timer | Authentifié |
| `POST` | `/api/attempts/save/{attempt_id}/` | Auto-sauvegarde en direct d'une réponse | Participant |
| `POST` | `/api/attempts/upload/{attempt_id}/{q_id}/`| Téléversement de fichier pour mission pratique | Participant |
| `POST` | `/api/attempts/submit/{attempt_id}/` | Soumission finale et calcul automatique | Participant |
| `GET` | `/api/attempts/my-history/` | Historique des épreuves du participant connecté | Authentifié |
| `GET` | `/api/attempts/admin-attempts/` | Liste des tentatives pour l'évaluation jury | Admin / Jury |
| `POST` | `/api/attempts/admin-attempts/grade-answer/{ans_id}/` | Attribution manuelle de la note pratique | Admin / Jury |

---

## 📊 4. Classement, Statistiques & Exports (`/api/analytics/`)

| Méthode | Endpoint | Description | Permissions |
|---|---|---|---|
| `GET` | `/api/analytics/leaderboard/` | Classement en direct (général ou par épreuve) | Authentifié |
| `GET` | `/api/analytics/dashboard-stats/` | Indicateurs de performance et KPIs | Admin / Jury |
| `GET` | `/api/analytics/logs/` | Journal d'audit des actions en temps réel | Admin |
| `GET` | `/api/analytics/settings/` | Consultation des paramètres de compétition | Public |
| `PATCH` | `/api/analytics/settings/` | Modification (ex: masquer/afficher classement) | Admin |
| `GET` | `/api/analytics/export/?format=excel` | Téléchargement du classeur Excel (.xlsx) | Admin |
| `GET` | `/api/analytics/export/?format=csv` | Téléchargement du fichier CSV standard | Admin |
