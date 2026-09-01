# Intégration Réseau Local TDC derrière Routeur MikroTik

Ce document explique comment brancher et exploiter le serveur TDC dans une infrastructure existante avec **Box FAI + MikroTik + Switch + Bornes Wi-Fi (AP)** sans modifier la configuration du MikroTik.

---

## 🏗️ 1. Schéma d'Architecture Réseau

```
                🌍 INTERNET (Optionnel pendant la compétition)
                      │
                   📦 BOX FAI
                      │
                  🔥 MikroTik (Config Actuelle Inchangée)
                 (DHCP, Routage, Passerelle : 192.168.1.1)
                      │
                   SWITCH ETHERNET
              ┌───────┼────────────────────────┐
              │       │                        │
        🖥️ SERVEUR TDC  📡 Point d'accès Wi-Fi 1  📡 Point d'accès Wi-Fi 2
       (192.168.1.50)  │                        │
                       └───────────┬────────────┘
                                   │
                           💻 📱 💻 📱 💻 📱
                      Participants (PC & Smartphones)
```

---

## 🎯 2. Règle d'or : Ne rien casser sur le MikroTik

Votre routeur MikroTik fonctionne déjà parfaitement :
- Il distribue les adresses IP automatiquement via son serveur DHCP.
- Il permet à tous les équipements reliés au switch et aux bornes Wi-Fi de communiquer entre eux sur le même sous-réseau (ex: `192.168.1.0/24`).

**Vous n'avez donc pas besoin de modifier les règles de routage ou de pare-feu de votre MikroTik pour que le TDC fonctionne localement.**

---

## 🔌 3. Procédure de raccordement en 4 étapes simples

### Étape 1 : Branchement physique
1. Reliez le serveur Ubuntu au Switch principal à l'aide d'un câble Ethernet RJ45 (Cat 6 recommandé).
2. Allumez le serveur.

### Étape 2 : Attribution d'une IP fixe au serveur TDC
Pour que tous les participants tapent toujours la même adresse (ex: `http://192.168.1.50`), vous pouvez soit :
- **Option A (Recommandée - sur le serveur Ubuntu)** : Configurer une IP statique dans `/etc/netplan/01-netcfg.yaml` en dehors de la plage DHCP dynamique.
- **Option B (sur MikroTik)** : Faire un simple *DHCP Lease -> Make Static* pour verrouiller l'adresse MAC du serveur.

#### Exemple de configuration Netplan Ubuntu (`/etc/netplan/01-netcfg.yaml`) :
```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0: # ou enp3s0 (vérifiez avec 'ip a')
      dhcp4: no
      addresses:
        - 192.168.1.50/24
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses: [1.1.1.1, 8.8.8.8]
```
Puis appliquez :
```bash
sudo netplan apply
```

### Étape 3 : Test de connectivité
Depuis un ordinateur portable connecté au Wi-Fi TeCoX :
1. Ouvrez le terminal / invite de commandes.
2. Tapez :
   ```bash
   ping 192.168.1.50
   ```
3. Si vous recevez des réponses, le serveur est directement joignable !

### Étape 4 : Accès navigateur
Ouvrez votre navigateur et accédez à :
```
http://192.168.1.50
```

---

## 💡 4. Nom de domaine local (Optionnel : `http://tdc.local`)

Si vous souhaitez que les participants accèdent via `http://tdc.local` au lieu de taper l'adresse IP :
- Sur Ubuntu Server, le service mDNS **Avahi** permet la résolution automatique `.local` :
  ```bash
  sudo apt install -y avahi-daemon
  sudo hostnamectl set-hostname tdc
  sudo systemctl restart avahi-daemon
  ```
- Les appareils récents (Windows 10/11, macOS, iOS, Android) peuvent ainsi accéder directement à :
  ```
  http://tdc.local
  ```
