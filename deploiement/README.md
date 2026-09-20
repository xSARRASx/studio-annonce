# Installer Studio Annonce sur le serveur

Prérequis : un serveur Linux (Ubuntu/Debian) avec accès root, un nom de domaine qui pointe dessus,
les ports 80 et 443 ouverts. Tout tourne dans Docker : rien d'autre à installer.

```bash
# 1. Docker (une fois)
curl -fsSL https://get.docker.com | sh

# 2. Le code
git clone https://github.com/xSARRASx/studio-annonce.git /opt/studio-annonce
cd /opt/studio-annonce/deploiement

# 3. Les réglages (clés, domaine, mots de passe) : jamais dans le dépôt
cp .env.example .env
openssl rand -hex 24   # à coller dans POSTGRES_PASSWORD
openssl rand -hex 24   # à coller dans SECRET_KEY
nano .env

# 4. Démarrer (construit le site et le cerveau, crée la base, obtient le certificat HTTPS)
docker compose up -d --build

# Vérifier
curl https://VOTRE-DOMAINE/api/sante      # {"ok":true}
docker compose logs -f api               # journaux du cerveau
```

Mettre à jour après un push sur GitHub :

```bash
cd /opt/studio-annonce && git pull && cd deploiement && docker compose up -d --build
```

Ce que ça installe : `db` (PostgreSQL), `api` (le cerveau Python, joignable seulement en interne),
`web` (le site statique + Caddy, qui gère le HTTPS et renvoie `/api/*` vers le cerveau).
Les photos vont sur Amazon S3 si les variables `S3_*` sont remplies, sinon sur le disque du serveur.
