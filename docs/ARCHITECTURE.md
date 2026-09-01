# Architecture Technique & Fonctionnelle — TDC 2026

## 🏛️ 1. Vue d'Ensemble de la Stack Technique

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Navigateur Participant / Admin                  │
│                     (PC, Tablettes, Smartphones - Responsive)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / Port 80
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          NGINX (Reverse Proxy)                         │
│       - Routage /      -> Next.js Frontend (Port 3000)                 │
│       - Routage /api/  -> Django REST API  (Port 8000)                 │
│       - Gestionnaire fichiers statiques & médias téléversés            │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│        Frontend Next.js 14        │ │        Backend Django 5 & DRF    │
│  - React 18, TypeScript, Tailwind │ │  - SimpleJWT Auth                │
│  - Lucide Icons, Chart.js         │ │  - Moteur d'évaluation auto/man  │
│  - Mode Sombre / Clair            │ │  - Exportateurs Excel / CSV      │
│  - Auto-sauvegarde & Timer Sync   │ │  - Journal d'audit d'actions     │
└───────────────────────────────────┘ └──────────────────┬───────────────┘
                                                         │
                                                         ▼
                                      ┌──────────────────────────────────┐
                                      │       PostgreSQL 16 Database     │
                                      │  - Utilisateurs & Rôles          │
                                      │  - 8 Épreuves, Questions & Choix │
                                      │  - Tentatives & Réponses         │
                                      │  - Classement & Audit Logs       │
                                      └──────────────────────────────────┘
```

---

## 🗄️ 2. Modèle de Données (Relations Principales)

### Entité `TdcUser` (Utilisateur)
- `role` : `ADMIN` | `JURY` | `PARTICIPANT`
- `participant_code` : Identifiant unique (ex: `TDC-2026-001`)
- `team_group` : Équipe d'appartenance (ex: "Équipe Alpha")
- `avatar`, `phone_number`, `is_active`, `last_activity`

### Entité `Trial` (Épreuve)
- `order` : N° de l'épreuve (1 à 8)
- `title`, `slug`, `category`, `description`, `instructions`
- `duration_minutes` : Durée allouée
- `max_score` : Barème total maximum
- `weight` : Coefficient d'épreuve (par défaut: 1.0)
- `status` : `DRAFT` | `OPEN` | `IN_PROGRESS` | `COMPLETED` | `ARCHIVED`

### Entité `Question` (Question / Mission)
- `trial` : Relation vers l'épreuve
- `question_type` :
  - `SINGLE_CHOICE` (QCM choix unique)
  - `MULTIPLE_CHOICE` (QCM choix multiples)
  - `TRUE_FALSE` (Vrai / Faux)
  - `SHORT_TEXT` (Texte court exact)
  - `NUMERIC` (Valeur numérique)
  - `PRACTICAL` (Mission pratique avec fichier à déposer)
- `points`, `difficulty`, `prompt`, `explanation`
- `attachment` : Fichier ressource téléchargeable fourni par le formateur
- `practical_instructions`, `practical_allowed_extensions`

### Entité `Option` (Choix de réponse)
- `question` : Relation vers la question parente
- `text` : Intitulé du choix
- `is_correct` : Booléen

### Entité `Attempt` (Tentative)
- `participant`, `trial`
- `status` : `in_progress` | `submitted` | `graded` | `expired`
- `started_at`, `submitted_at`, `time_spent_seconds`
- `auto_score`, `manual_score`, `total_score`, `max_possible_score`, `percentage`

### Entité `Answer` (Réponse détaillée)
- `attempt`, `question`
- `selected_options` : Options choisies par le candidat
- `text_answer` : Réponse saisie
- `file_upload` : Fichier de mission téléversé par le participant
- `score_awarded`, `is_graded`, `is_correct`, `jury_feedback`, `graded_by`

---

## 📊 3. Système de Calcul des Scores & Classement

### Formule de calcul par épreuve :
$$\text{Score Épreuve} = \text{Score Automatique} + \text{Score Manuel Jury}$$

$$\text{Pourcentage Épreuve} = \left( \frac{\text{Score Épreuve}}{\text{Barème Max Épreuve}} \right) \times 100$$

### Formule globale de compétition :
$$\text{Score Global} = \sum_{i=1}^{8} \left( \text{Score Épreuve}_i \times \text{Poids}_i \right)$$

$$\text{Pourcentage Global} = \left( \frac{\text{Score Total Obtenu}}{\text{Score Total Possible}} \right) \times 100$$

### Règles de départage au classement :
1. **Critère 1** : Score total obtenu le plus élevé.
2. **Critère 2** : En cas d'égalité stricte, le participant ayant cumulé le temps le plus court sur l'ensemble de ses épreuves est classé en premier.
