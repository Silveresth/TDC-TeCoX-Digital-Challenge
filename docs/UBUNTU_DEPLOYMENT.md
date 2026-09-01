# Guide de Déploiement TDC — Ubuntu Server LTS & Docker

Ce guide pas à pas est spécialement conçu pour installer et faire tourner l'application **TDC (TeCoX Digital Challenge)** sur une machine **Ubuntu Server 22.04 / 24.04 LTS**, même pour un débutant avec Docker.

---

## 📋 Prérequis matériels & logiciels

1. Un ordinateur / serveur équipé d'**Ubuntu Server** connecté au switch ou réseau local via un câble Ethernet.
2. Une adresse IP locale (ex: `192.168.1.50`).
3. Les droits d'administration (`sudo`).

---

## 🚀 Étape 1 : Mise à jour du système Ubuntu

Ouvrez le terminal sur votre serveur et lancez :

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw
```

---

## 🐳 Étape 2 : Installation de Docker et Docker Compose

Exécutez la commande officielle pour installer Docker Engine :

```bash
# 1. Télécharger le script d'installation officiel
curl -fsSL https://get.docker.com -o get-docker.sh

# 2. Exécuter le script
sudo sh get-docker.sh

# 3. Ajouter votre utilisateur au groupe docker (pour éviter d'utiliser sudo à chaque fois)
sudo usermod -aG docker $USER

# 4. Vérifier l'installation
docker --version
docker compose version
```

> **Important** : Déconnectez-vous et reconnectez-vous à la session SSH ou console pour que les droits soient pris en compte (`exit` puis reconnexion).

---

## 📂 Étape 3 : Copie du projet sur le serveur

Clonez ou copiez le dossier du projet dans `/opt/tdc` ou dans votre dossier utilisateur :

```bash
# Exemple dans votre dossier home
cd ~
git clone <URL_DU_DEPOT> tdc-tecox
cd tdc-tecox
```

---

## ⚙️ Étape 4 : Configuration des variables d'environnement

Copiez le modèle de configuration `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Vous pouvez éditer les mots de passe si vous le souhaitez :
```bash
nano .env
```

---

## 🚀 Étape 5 : Lancement de l'application avec Docker Compose

Pour démarrer tous les conteneurs (PostgreSQL, Django API, Next.js Frontend, Nginx Reverse Proxy) en tâche de fond :

```bash
docker compose up -d --build
```

### Vérification du statut des services :
```bash
docker compose ps
```
Vous devriez voir les 4 conteneurs avec le statut `running` / `healthy` :
- `tdc_postgres`
- `tdc_backend`
- `tdc_frontend`
- `tdc_nginx`

---

## 🌐 Étape 6 : Accès depuis les autres ordinateurs du réseau local

Trouvez l'adresse IP de votre serveur avec :
```bash
ip a
```
*(Par exemple : `192.168.1.50`)*

Depuis n'importe quel ordinateur ou smartphone connecté au même Wi-Fi ou réseau switch :
- Ouvrez le navigateur (Chrome, Firefox, Safari, Edge)
- Tapez simplement :
  ```
  http://192.168.1.50
  ```

---

## 🔑 Identifiants d'accès pré-configurés

| Espace | URL | Identifiant | Mot de passe |
|---|---|---|---|
| **Espace Administrateur** | `http://IP_SERVEUR/admin` ou `/login` | `admin` | `Admin@TDC2026!` |
| **Espace Jury** | `http://IP_SERVEUR/login` | `jury` | `Jury@TDC2026!` |
| **Espace Participant Démo** | `http://IP_SERVEUR/login` | `TDC-2026-001` | `Tdc2026!` |

---

## 🛠️ Commandes utiles pour l'administration quotidienne

### Voir les logs en direct :
```bash
docker compose logs -f
```

### Voir les logs d'un service spécifique (ex: backend) :
```bash
docker compose logs -f backend
```

### Redémarrer l'application :
```bash
docker compose restart
```

### Arrêter l'application :
```bash
docker compose down
```

### Sauvegarder la base de données :
```bash
bash scripts/backup_database.sh
```

### Restaurer une sauvegarde :
```bash
bash scripts/restore_database.sh backups/tdc_backup_XXXX.sql.gz
```
